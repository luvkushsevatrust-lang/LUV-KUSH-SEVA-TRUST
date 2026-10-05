import { supabase } from './supabase';
import {
  ServiceApplication,
  Student,
  IdCard,
  Volunteer,
  Donation,
  Announcement,
  TrustSettings,
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
  mobile TEXT NOT NULL,
  email TEXT,
  amount NUMERIC NOT NULL,
  payment_mode TEXT,
  transaction_id TEXT,
  purpose TEXT,
  is_verified BOOLEAN DEFAULT TRUE,
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

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access donations') THEN
    CREATE POLICY "Allow public access donations" ON public.donations FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access announcements') THEN
    CREATE POLICY "Allow public access announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access trust_settings') THEN
    CREATE POLICY "Allow public access trust_settings" ON public.trust_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

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
  async fetchApplications(): Promise<ServiceApplication[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase.from('applications').select('*').order('submitted_at', { ascending: false });
      if (error || !data) return null;
      return data.map((row: any) => ({
        ...(row.raw_data || {}),
        id: row.id,
        serviceCategory: row.service_category || row.raw_data?.serviceCategory,
        serviceTitleHi: row.service_title_hi || row.raw_data?.serviceTitleHi,
        fullName: row.full_name || row.raw_data?.fullName,
        fatherOrHusbandName: row.father_or_husband_name || row.raw_data?.fatherOrHusbandName,
        motherName: row.mother_name || row.raw_data?.motherName,
        dob: row.dob || row.raw_data?.dob,
        gender: row.gender || row.raw_data?.gender,
        mobile: row.mobile || row.raw_data?.mobile,
        email: row.email || row.raw_data?.email,
        aadhaarNumber: row.aadhaar_number || row.raw_data?.aadhaarNumber,
        address: row.address || row.raw_data?.address,
        state: row.state || row.raw_data?.state,
        district: row.district || row.raw_data?.district,
        pincode: row.pincode || row.raw_data?.pincode,
        status: row.status || row.raw_data?.status || 'Pending',
        submittedAt: row.submitted_at || row.raw_data?.submittedAt,
        remarks: row.remarks || row.raw_data?.remarks,
        photoUrl: row.photo_url || row.raw_data?.photoUrl,
        aadhaarFrontUrl: row.aadhaar_front_url || row.raw_data?.aadhaarFrontUrl,
        aadhaarBackUrl: row.aadhaar_back_url || row.raw_data?.aadhaarBackUrl,
      }));
    });
  },

  async saveApplication(app: ServiceApplication): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload = {
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
        photo_url: app.photoUrl,
        aadhaar_front_url: app.aadhaarFrontUrl,
        aadhaar_back_url: app.aadhaarBackUrl,
        raw_data: app,
      };
      const { error } = await supabase.from('applications').upsert(payload);
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
  async fetchStudents(): Promise<Student[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase.from('students').select('*').order('registered_at', { ascending: false });
      if (error || !data) return null;
      return data.map((row: any) => ({
        ...(row.raw_data || {}),
        id: row.id,
        registrationNumber: row.registration_number || row.raw_data?.registrationNumber,
        name: row.full_name || row.raw_data?.name,
        fatherName: row.father_name || row.raw_data?.fatherName,
        motherName: row.mother_name || row.raw_data?.motherName,
        dob: row.dob || row.raw_data?.dob,
        gender: row.gender || row.raw_data?.gender,
        mobile: row.mobile || row.raw_data?.mobile,
        email: row.email || row.raw_data?.email,
        aadhaarNumber: row.aadhaar_number || row.raw_data?.aadhaarNumber,
        address: row.address || row.raw_data?.address,
        district: row.raw_data?.district || 'नालंदा',
        state: row.raw_data?.state || 'बिहार',
        pinCode: row.raw_data?.pinCode || '803116',
        studentClass: row.current_class || row.raw_data?.studentClass,
        schoolOrInstitute: row.school_or_college || row.raw_data?.schoolOrInstitute,
        category: row.category || row.raw_data?.category || 'OBC',
        status: row.status || row.raw_data?.status || 'Active',
        registeredAt: row.registered_at || row.raw_data?.registeredAt,
        password: row.password || row.raw_data?.password || 'password123',
        photoUrl: row.photo_url || row.raw_data?.photoUrl,
        aadhaarFrontUrl: row.aadhaar_front_url || row.raw_data?.aadhaarFrontUrl,
        aadhaarBackUrl: row.aadhaar_back_url || row.raw_data?.aadhaarBackUrl,
      }));
    });
  },

  async saveStudent(stu: Student): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload = {
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
        photo_url: stu.photoUrl,
        aadhaar_front_url: stu.aadhaarFrontUrl,
        aadhaar_back_url: stu.aadhaarBackUrl,
        raw_data: stu,
      };
      const { error } = await supabase.from('students').upsert(payload);
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
  async fetchIdCards(): Promise<IdCard[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase.from('id_cards').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map((row: any) => ({
        ...(row.raw_data || {}),
        id: row.id,
        cardNumber: row.card_number || row.raw_data?.cardNumber,
        category: row.category || row.raw_data?.category,
        categoryLabelHi: row.category_title_hi || row.raw_data?.categoryLabelHi,
        categoryLabelEn: row.category_title_en || row.raw_data?.categoryLabelEn,
        fullName: row.full_name || row.raw_data?.fullName,
        fatherOrHusbandName: row.father_or_husband_name || row.raw_data?.fatherOrHusbandName,
        dob: row.dob || row.raw_data?.dob,
        gender: row.gender || row.raw_data?.gender,
        mobile: row.mobile || row.raw_data?.mobile,
        bloodGroup: row.blood_group || row.raw_data?.bloodGroup,
        aadhaarNumber: row.aadhaar_number || row.raw_data?.aadhaarNumber,
        address: row.address || row.raw_data?.address,
        photoUrl: row.photo_url || row.raw_data?.photoUrl,
        issueDate: row.issue_date || row.raw_data?.issueDate,
        validTill: row.valid_upto || row.raw_data?.validTill,
        status: row.status || row.raw_data?.status || 'Approved',
        createdAt: row.created_at || row.raw_data?.createdAt,
      }));
    });
  },

  async saveIdCard(card: IdCard): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload = {
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
        photo_url: card.photoUrl,
        issue_date: card.issueDate,
        valid_upto: card.validTill,
        status: card.status,
        created_at: card.createdAt || new Date().toISOString(),
        raw_data: card,
      };
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
  async fetchVolunteers(): Promise<Volunteer[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase.from('volunteers').select('*').order('registered_at', { ascending: false });
      if (error || !data) return null;
      return data.map((row: any) => ({
        ...(row.raw_data || {}),
        id: row.id,
        name: row.name || row.raw_data?.name,
        age: row.raw_data?.age || 25,
        gender: row.gender || row.raw_data?.gender || 'Male',
        mobile: row.mobile || row.raw_data?.mobile,
        email: row.email || row.raw_data?.email,
        aadhaarNumber: row.aadhaar_number || row.raw_data?.aadhaarNumber,
        address: row.address || row.raw_data?.address,
        district: row.raw_data?.district || 'नालंदा',
        occupation: row.occupation || row.raw_data?.occupation || 'समाजसेवी',
        skills: row.skills || row.raw_data?.skills || 'सामुदायिक सेवा',
        preferredService: row.preferred_service || row.raw_data?.preferredService || 'जनसेवा',
        availableTime: row.availability || row.raw_data?.availableTime || 'पूर्णकालिक',
        status: row.status || row.raw_data?.status || 'Pending',
        registeredAt: row.registered_at || row.raw_data?.registeredAt,
        photoUrl: row.photo_url || row.raw_data?.photoUrl,
        aadhaarFrontUrl: row.aadhaar_front_url || row.raw_data?.aadhaarFrontUrl,
        aadhaarBackUrl: row.aadhaar_back_url || row.raw_data?.aadhaarBackUrl,
      }));
    });
  },

  async saveVolunteer(vol: Volunteer): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload = {
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
        photo_url: vol.photoUrl,
        aadhaar_front_url: vol.aadhaarFrontUrl,
        aadhaar_back_url: vol.aadhaarBackUrl,
        raw_data: vol,
      };
      const { error } = await supabase.from('volunteers').upsert(payload);
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
  async fetchDonations(): Promise<Donation[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase.from('donations').select('*').order('donated_at', { ascending: false });
      if (error || !data) return null;
      return data.map((row: any) => ({
        ...(row.raw_data || {}),
        id: row.id,
        receiptNumber: row.receipt_number || row.raw_data?.receiptNumber,
        donorName: row.donor_name || row.raw_data?.donorName,
        mobile: row.mobile || row.raw_data?.mobile,
        email: row.email || row.raw_data?.email,
        amount: Number(row.amount ?? row.raw_data?.amount ?? 0),
        paymentMethod: row.payment_mode || row.raw_data?.paymentMethod || 'UPI',
        transactionId: row.transaction_id || row.raw_data?.transactionId,
        message: row.purpose || row.raw_data?.message,
        isVerified: row.is_verified ?? row.raw_data?.isVerified ?? true,
        donatedAt: row.donated_at || row.raw_data?.donatedAt,
      }));
    });
  },

  async saveDonation(d: Donation): Promise<boolean> {
    const res = await safeQuery(async () => {
      const payload = {
        id: d.id,
        receipt_number: d.receiptNumber,
        donor_name: d.donorName,
        mobile: d.mobile,
        email: d.email,
        amount: d.amount,
        payment_mode: d.paymentMethod,
        transaction_id: d.transactionId,
        purpose: d.message,
        is_verified: d.isVerified,
        donated_at: d.donatedAt || new Date().toISOString(),
        raw_data: d,
      };
      const { error } = await supabase.from('donations').upsert(payload);
      return !error;
    });
    return Boolean(res);
  },

  // --- ANNOUNCEMENTS ---
  async fetchAnnouncements(): Promise<Announcement[] | null> {
    return safeQuery(async () => {
      const { data, error } = await supabase.from('announcements').select('*');
      if (error || !data) return null;
      return data.map((row: any) => ({
        ...(row.raw_data || {}),
        id: row.id,
        title: row.title || row.raw_data?.title,
        date: row.date || row.raw_data?.date,
        content: row.content || row.raw_data?.content,
        isImportant: row.is_important ?? row.raw_data?.isImportant ?? false,
        imageUrl: row.image_url || row.raw_data?.imageUrl,
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
        raw_data: ann,
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
      const { data, error } = await supabase.from('trust_settings').select('*').eq('id', 'current_settings').single();
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
      // 1. Applications
      for (const app of allData.applications) {
        const ok = await this.saveApplication(app);
        if (ok) counts.applications++;
      }

      // 2. Students
      for (const stu of allData.students) {
        const ok = await this.saveStudent(stu);
        if (ok) counts.students++;
      }

      // 3. ID Cards
      for (const card of allData.idCards) {
        const ok = await this.saveIdCard(card);
        if (ok) counts.idCards++;
      }

      // 4. Volunteers
      for (const vol of allData.volunteers) {
        const ok = await this.saveVolunteer(vol);
        if (ok) counts.volunteers++;
      }

      // 5. Donations
      for (const don of allData.donations) {
        const ok = await this.saveDonation(don);
        if (ok) counts.donations++;
      }

      // 6. Announcements
      for (const ann of allData.announcements) {
        const ok = await this.saveAnnouncement(ann);
        if (ok) counts.announcements++;
      }

      // 7. Settings
      await this.saveSettings(allData.settings);

      return { success: true, syncedCounts: counts };
    } catch (err: any) {
      return { success: false, syncedCounts: counts, error: err?.message || 'Sync failed' };
    }
  },
};
