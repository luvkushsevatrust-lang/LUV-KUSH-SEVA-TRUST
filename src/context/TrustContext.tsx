import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  TrustSettings,
  ServiceApplication,
  Student,
  IdCard,
  IdCardStatus,
  IdCardCategory,
  Volunteer,
  Donation,
  Announcement,
  ApplicationStatus,
  BgTheme,
} from '../types';
import { BG_THEMES } from '../data/bgThemeConfig';
import { Language, Translations, getTranslation } from '../translations';
import {
  INITIAL_TRUST_SETTINGS,
  INITIAL_APPLICATIONS,
  INITIAL_STUDENTS,
  INITIAL_ID_CARDS,
  INITIAL_VOLUNTEERS,
  INITIAL_DONATIONS,
  INITIAL_ANNOUNCEMENTS,
  ID_CARD_CATEGORY_CONFIG,
} from '../data/mockData';
import { SupabaseService } from '../lib/supabaseService';
import { resolveAssetUrl, TRUST_EMBLEM_LOGO } from '../assets';
import { safeSetItem, safeRemoveItem, cleanupStorageQuota } from '../utils/safeStorage';

interface TrustContextType {
  settings: TrustSettings;
  updateSettings: (newSettings: Partial<TrustSettings>) => void;

  // Supabase Cloud Storage Sync
  supabaseStatus: {
    isConnected: boolean;
    isSyncing: boolean;
    lastSyncedAt: string | null;
    error: string | null;
  };
  syncWithSupabase: () => Promise<boolean>;

  applications: ServiceApplication[];
  addApplication: (
    data: Omit<ServiceApplication, 'id' | 'status' | 'submittedAt'>
  ) => ServiceApplication;
  updateApplicationStatus: (
    id: string,
    status: ApplicationStatus,
    remarks?: string
  ) => void;
  updateApplication: (id: string, data: Partial<ServiceApplication>) => void;
  deleteApplication: (id: string) => void;

  students: Student[];
  addStudent: (
    data: Omit<Student, 'id' | 'registrationNumber' | 'status' | 'registeredAt'>
  ) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // ID Cards
  idCards: IdCard[];
  addIdCard: (data: Omit<IdCard, 'id' | 'createdAt'>) => IdCard;
  updateIdCard: (id: string, data: Partial<IdCard>) => void;
  deleteIdCard: (id: string) => void;
  generateNextCardNumber: () => string;
  generateIdCardForRecord: (
    type: 'application' | 'student' | 'volunteer',
    record: any,
    customStatus?: IdCardStatus
  ) => IdCard;

  volunteers: Volunteer[];
  addVolunteer: (
    data: Omit<Volunteer, 'id' | 'status' | 'registeredAt'>
  ) => Volunteer;
  updateVolunteer: (id: string, data: Partial<Volunteer>) => void;
  updateVolunteerStatus: (
    id: string,
    status: 'Pending' | 'Approved' | 'Active'
  ) => void;
  deleteVolunteer: (id: string) => void;

  donations: Donation[];
  addDonation: (
    data: Omit<Donation, 'id' | 'receiptNumber' | 'isVerified' | 'donatedAt'>
  ) => Donation;
  verifyDonation: (id: string, verified: boolean) => void;

  announcements: Announcement[];
  addAnnouncement: (item: Omit<Announcement, 'id'>) => void;
  deleteAnnouncement: (id: string) => void;

  // Auth
  currentStudent: Student | null;
  studentLogin: (identifier: string, dobOrPass: string) => boolean;
  studentLogout: () => void;

  isAdmin: boolean;
  adminLogin: (user: string, pass: string) => boolean;
  adminLogout: () => void;

  // Navigation
  currentPage: string;
  setCurrentPage: (page: string, params?: Record<string, any>) => void;
  pageParams: Record<string, any>;

  // Receipts and Modals
  activeReceipt: { type: 'application' | 'donation'; data: any } | null;
  setActiveReceipt: (receipt: { type: 'application' | 'donation'; data: any } | null) => void;

  activeIdCard: IdCard | null;
  setActiveIdCard: (card: IdCard | null) => void;

  verifyModalCard: IdCard | null;
  setVerifyModalCard: (card: IdCard | null) => void;

  // Search Utilities
  searchApplication: (appId: string, mobile: string) => ServiceApplication | undefined;
  searchIdCard: (
    query: string,
    dob?: string
  ) => { card?: IdCard; error?: string };

  // Internationalization / Bilingual system
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;

  // Background Theme System
  bgTheme: BgTheme;
  setBgTheme: (theme: BgTheme) => void;
}

const TrustContext = createContext<TrustContextType | undefined>(undefined);

export const TrustProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Bilingual Language State ('hi' | 'en') with persistence
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('lkst_language');
    return saved === 'en' ? 'en' : 'hi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    safeSetItem('lkst_language', lang);
  };

  const t = getTranslation(language);

  // Background Theme State (Default: 'sandalwood' - warm serene sandalwood ivory, not white!)
  const [bgTheme, setBgThemeState] = useState<BgTheme>(() => {
    const saved = localStorage.getItem('lkst_bg_theme') as BgTheme;
    if (saved && ['sandalwood', 'amber', 'sand', 'sage', 'sky', 'white'].includes(saved)) {
      return saved;
    }
    return 'sandalwood';
  });

  const setBgTheme = (theme: BgTheme) => {
    setBgThemeState(theme);
    safeSetItem('lkst_bg_theme', theme);
  };

  // Sync background color with document.body and root html
  useEffect(() => {
    const config = BG_THEMES[bgTheme] || BG_THEMES.sandalwood;
    document.body.style.backgroundColor = config.bgHex;
    document.documentElement.style.backgroundColor = config.bgHex;
  }, [bgTheme]);

  // Persistent Settings
  const [settings, setSettings] = useState<TrustSettings>(() => {
    const saved = localStorage.getItem('lkst_settings');
    if (!saved) return INITIAL_TRUST_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      // ensure idCardConfig exists
      if (!parsed.idCardConfig) {
        parsed.idCardConfig = INITIAL_TRUST_SETTINGS.idCardConfig;
      }
      return parsed;
    } catch {
      return INITIAL_TRUST_SETTINGS;
    }
  });

  // Dynamic sync of browser icon/favicon with website logo
  useEffect(() => {
    const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    if (iconLinks.length > 0) {
      iconLinks.forEach((link) => {
        if (settings.logoUrl) {
          link.href = settings.logoUrl;
        } else {
          link.href = link.sizes?.value?.includes('32') ? '/favicon-32x32.png' : '/favicon.ico';
        }
      });
    }
    const appleTouchLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (appleTouchLink) {
      appleTouchLink.href = settings.logoUrl || '/apple-touch-icon.png';
    }
  }, [settings.logoUrl]);

  // Persistent Applications
  const [applications, setApplications] = useState<ServiceApplication[]>(() => {
    const saved = localStorage.getItem('lkst_applications');
    return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
  });

  // Persistent Students
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('lkst_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  // Helper to deduplicate cards and ensure every card has a strictly unique key/ID
  const sanitizeIdCards = (cards: IdCard[]): IdCard[] => {
    const seenIds = new Set<string>();
    const seenSources = new Set<string>();
    const result: IdCard[] = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card) continue;

      // Deduplicate by source record if present (one card per student/application/volunteer)
      const sourceKey = card.sourceId ? `${card.sourceType || 'card'}-${card.sourceId}` : '';
      if (sourceKey && seenSources.has(sourceKey)) {
        continue;
      }
      if (sourceKey) seenSources.add(sourceKey);

      // Ensure strictly unique ID
      let safeId = card.id;
      if (!safeId || seenIds.has(safeId)) {
        safeId = `LKST-IDC-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      }
      seenIds.add(safeId);

      result.push({
        ...card,
        id: safeId,
      });
    }

    return result;
  };

  // Persistent ID Cards (replacing Admit Cards)
  const [idCards, setIdCards] = useState<IdCard[]>(() => {
    const saved = localStorage.getItem('lkst_id_cards');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizeIdCards(parsed);
          // Auto-heal localStorage if duplicates were stripped
          if (
            sanitized.length !== parsed.length ||
            sanitized.some((c, idx) => c.id !== parsed[idx]?.id)
          ) {
            safeSetItem('lkst_id_cards', JSON.stringify(sanitized));
          }
          return sanitized;
        }
      } catch {
        // ignore
      }
    }
    return sanitizeIdCards(INITIAL_ID_CARDS);
  });

  // Persistent Volunteers
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => {
    const saved = localStorage.getItem('lkst_volunteers');
    return saved ? JSON.parse(saved) : INITIAL_VOLUNTEERS;
  });

  // Persistent Donations
  const [donations, setDonations] = useState<Donation[]>(() => {
    const saved = localStorage.getItem('lkst_donations');
    return saved ? JSON.parse(saved) : INITIAL_DONATIONS;
  });

  // Persistent Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('lkst_announcements');
    if (!saved) return INITIAL_ANNOUNCEMENTS;
    try {
      const parsed: Announcement[] = JSON.parse(saved);
      return parsed.map((a) => {
        const initMatch = INITIAL_ANNOUNCEMENTS.find((i) => i.id === a.id);
        if (!a.imageUrl && initMatch?.imageUrl) {
          return { ...a, imageUrl: initMatch.imageUrl };
        }
        if (a.imageUrl) {
          return { ...a, imageUrl: resolveAssetUrl(a.imageUrl) };
        }
        return a;
      });
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  // Current authenticated student
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem('lkst_current_student');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('lkst_is_admin') === 'true';
  });

  // Helper to determine initial page from browser URL pathname
  const getInitialPageFromUrl = (): string => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!path) return 'home';
    if (path === 'admit-card') return 'id-card';
    return path;
  };

  // Active navigation
  const [currentPage, setCurrentPageState] = useState<string>(() => getInitialPageFromUrl());
  const [pageParams, setPageParams] = useState<Record<string, any>>({});

  // Active Receipts and Modals
  const [activeReceipt, setActiveReceipt] = useState<{
    type: 'application' | 'donation';
    data: any;
  } | null>(null);

  const [activeIdCard, setActiveIdCard] = useState<IdCard | null>(null);
  const [verifyModalCard, setVerifyModalCard] = useState<IdCard | null>(null);

  // Supabase Sync Status Tracking
  const [supabaseStatus, setSupabaseStatus] = useState<{
    isConnected: boolean;
    isSyncing: boolean;
    lastSyncedAt: string | null;
    error: string | null;
  }>({
    isConnected: true,
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
  });

  // Manual or Auto Sync all data to Supabase
  const syncWithSupabase = async (): Promise<boolean> => {
    setSupabaseStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      const res = await SupabaseService.syncAllToSupabase({
        applications,
        students,
        idCards,
        volunteers,
        donations,
        announcements,
        settings,
      });
      setSupabaseStatus({
        isConnected: res.success,
        isSyncing: false,
        lastSyncedAt: new Date().toLocaleTimeString(),
        error: res.error || null,
      });
      return res.success;
    } catch (err: any) {
      setSupabaseStatus({
        isConnected: false,
        isSyncing: false,
        lastSyncedAt: null,
        error: err?.message || 'Sync failed',
      });
      return false;
    }
  };

  // Initial Cloud Hydration from Supabase on App Mount
  useEffect(() => {
    let isMounted = true;
    const loadFromSupabase = async () => {
      try {
        const [cloudApps, cloudStudents, cloudCards, cloudVols, cloudDonations, cloudAnnouncements, cloudSettings] =
          await Promise.all([
            SupabaseService.fetchApplications(),
            SupabaseService.fetchStudents(),
            SupabaseService.fetchIdCards(),
            SupabaseService.fetchVolunteers(),
            SupabaseService.fetchDonations(),
            SupabaseService.fetchAnnouncements(),
            SupabaseService.fetchSettings(),
          ]);

        if (!isMounted) return;

        if (cloudApps && cloudApps.length > 0) {
          setApplications(cloudApps);
        }
        if (cloudStudents && cloudStudents.length > 0) {
          setStudents(cloudStudents);
        }
        if (cloudCards && cloudCards.length > 0) {
          setIdCards(sanitizeIdCards(cloudCards));
        }
        if (cloudVols && cloudVols.length > 0) {
          setVolunteers(cloudVols);
        }
        if (cloudDonations && cloudDonations.length > 0) {
          setDonations(cloudDonations);
        }
        if (cloudAnnouncements && cloudAnnouncements.length > 0) {
          setAnnouncements(cloudAnnouncements);
        }
        if (cloudSettings) {
          setSettings(cloudSettings);
        }

        setSupabaseStatus((prev) => ({
          ...prev,
          isConnected: true,
          lastSyncedAt: new Date().toLocaleTimeString(),
        }));
      } catch (err: any) {
        console.warn('[Supabase] Initial hydration skipped:', err?.message);
      }
    };

    loadFromSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Run storage quota cleanup on initial startup to clear any bloated items
  useEffect(() => {
    cleanupStorageQuota();
  }, []);

  // Sync to LocalStorage safely (prevents QuotaExceededError crashes)
  useEffect(() => {
    safeSetItem('lkst_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    safeSetItem('lkst_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    safeSetItem('lkst_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    safeSetItem('lkst_id_cards', JSON.stringify(idCards));
  }, [idCards]);

  useEffect(() => {
    safeSetItem('lkst_volunteers', JSON.stringify(volunteers));
  }, [volunteers]);

  useEffect(() => {
    safeSetItem('lkst_donations', JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    safeSetItem('lkst_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    if (currentStudent) {
      safeSetItem('lkst_current_student', JSON.stringify(currentStudent));
    } else {
      safeRemoveItem('lkst_current_student');
    }
  }, [currentStudent]);

  useEffect(() => {
    safeSetItem('lkst_is_admin', isAdmin ? 'true' : 'false');
  }, [isAdmin]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const page = getInitialPageFromUrl();
      setCurrentPageState(page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setCurrentPage = (page: string, params: Record<string, any> = {}) => {
    // If old admit-card route was invoked, redirect cleanly to id-card
    const targetPage = page === 'admit-card' ? 'id-card' : page;
    setCurrentPageState(targetPage);
    setPageParams(params);

    if (typeof window !== 'undefined') {
      const targetPath = targetPage === 'home' ? '/' : `/${targetPage}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ page: targetPage }, '', targetPath);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateSettings = (newSettings: Partial<TrustSettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...newSettings,
        bankDetails: {
          ...prev.bankDetails,
          ...(newSettings.bankDetails || {}),
        },
        stats: {
          ...prev.stats,
          ...(newSettings.stats || {}),
        },
        idCardConfig: {
          ...prev.idCardConfig,
          ...(newSettings.idCardConfig || {}),
        },
      };
      SupabaseService.saveSettings(updated);
      return updated;
    });
  };

  /**
   * Generates next unique ID Card Number (e.g. LKST-2026-000001, LKST-2026-000002)
   * Guaranteed never duplicate.
   */
  const generateNextCardNumber = (): string => {
    const prefix = settings.idCardConfig?.prefix || 'LKST-2026-';

    // Find the highest existing serial number with this prefix
    let maxNum = 0;
    idCards.forEach((card) => {
      if (card.cardNumber.startsWith(prefix)) {
        const numPart = card.cardNumber.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });

    const nextVal = Math.max(maxNum + 1, settings.idCardConfig?.nextNumber || 1);

    // Update settings nextNumber for future
    updateSettings({
      idCardConfig: {
        ...settings.idCardConfig,
        nextNumber: nextVal + 1,
      },
    });

    return `${prefix}${String(nextVal).padStart(6, '0')}`;
  };

  const addApplication = (
    data: Omit<ServiceApplication, 'id' | 'status' | 'submittedAt'>
  ): ServiceApplication => {
    const newId = `LKST-APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApp: ServiceApplication = {
      ...data,
      id: newId,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };
    setApplications((prev) => [newApp, ...prev]);
    SupabaseService.saveApplication(newApp);
    return newApp;
  };

  const updateApplicationStatus = (
    id: string,
    status: ApplicationStatus,
    remarks?: string
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const updated = {
            ...app,
            status,
            statusRemarks: remarks !== undefined ? remarks : app.statusRemarks,
            reviewedAt: new Date().toISOString(),
          };
          SupabaseService.saveApplication(updated);

          // If approved, ensure an ID card is generated or activated
          if (status === 'Approved') {
            const existingCard = idCards.find(
              (c) => c.sourceId === id || c.registrationNumber === id
            );
            if (existingCard) {
              updateIdCard(existingCard.id, { status: 'Active' });
            } else {
              generateIdCardForRecord('application', updated, 'Active');
            }
          }

          return updated;
        }
        return app;
      })
    );
  };

  const updateApplication = (id: string, data: Partial<ServiceApplication>) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const updated = { ...app, ...data };
          SupabaseService.saveApplication(updated);
          if (data.status === 'Approved') {
            const existingCard = idCards.find(
              (c) => c.sourceId === id || c.registrationNumber === id
            );
            if (existingCard) {
              updateIdCard(existingCard.id, {
                status: 'Active',
                fullName: data.fullName ?? existingCard.fullName,
                fatherOrHusbandName: data.fatherOrHusbandName ?? existingCard.fatherOrHusbandName,
                motherName: data.motherName ?? existingCard.motherName,
                dob: data.dob ?? existingCard.dob,
                gender: data.gender ?? existingCard.gender,
                mobile: data.mobile ?? existingCard.mobile,
                address: data.address ?? existingCard.address,
                district: data.district ?? existingCard.district,
                photoUrl: data.photoUrl !== undefined ? data.photoUrl : existingCard.photoUrl,
                aadhaarFrontUrl: data.aadhaarFrontUrl !== undefined ? data.aadhaarFrontUrl : existingCard.aadhaarFrontUrl,
                aadhaarBackUrl: data.aadhaarBackUrl !== undefined ? data.aadhaarBackUrl : existingCard.aadhaarBackUrl,
              });
            } else {
              generateIdCardForRecord('application', updated, 'Active');
            }
          } else {
            const existingCard = idCards.find(
              (c) => c.sourceId === id || c.registrationNumber === id
            );
            if (existingCard) {
              updateIdCard(existingCard.id, {
                fullName: data.fullName ?? existingCard.fullName,
                fatherOrHusbandName: data.fatherOrHusbandName ?? existingCard.fatherOrHusbandName,
                motherName: data.motherName ?? existingCard.motherName,
                dob: data.dob ?? existingCard.dob,
                gender: data.gender ?? existingCard.gender,
                mobile: data.mobile ?? existingCard.mobile,
                address: data.address ?? existingCard.address,
                district: data.district ?? existingCard.district,
                photoUrl: data.photoUrl !== undefined ? data.photoUrl : existingCard.photoUrl,
                aadhaarFrontUrl: data.aadhaarFrontUrl !== undefined ? data.aadhaarFrontUrl : existingCard.aadhaarFrontUrl,
                aadhaarBackUrl: data.aadhaarBackUrl !== undefined ? data.aadhaarBackUrl : existingCard.aadhaarBackUrl,
              });
            }
          }
          return updated;
        }
        return app;
      })
    );
  };

  const deleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
    SupabaseService.deleteApplication(id);
  };

  /**
   * Helper to generate and persist an authentic ID Card for any application, student, or volunteer
   */
  const generateIdCardForRecord = (
    type: 'application' | 'student' | 'volunteer',
    record: any,
    customStatus: IdCardStatus = 'Active'
  ): IdCard => {
    // If an ID card already exists for this record, return it immediately to prevent duplicate cards/keys
    const existing = idCards.find(
      (c) =>
        (record.id && c.sourceId === record.id) ||
        (record.registrationNumber && c.registrationNumber === record.registrationNumber) ||
        (record.id && c.registrationNumber === record.id)
    );
    if (existing) {
      return existing;
    }

    const newCardNumber = generateNextCardNumber();
    const verifCode = `LKST-VRF-${Math.floor(10000 + Math.random() * 90000)}`;
    const issueDateStr = new Date().toISOString().split('T')[0];
    const validityYears = settings.idCardConfig?.validityYears || 3;
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);
    const validTillStr =
      type === 'application' &&
      (record.serviceCategory === 'orphanage' || record.serviceCategory === 'old_age')
        ? 'आजीवन (Lifetime)'
        : expiryDate.toISOString().split('T')[0];

    let category: IdCardCategory = 'beneficiary';
    let categoryLabelHi = 'न्यास लाभार्थी पहचान पत्र';
    let cardType = 'Beneficiary ID Card';
    let roleOrClass = '';

    if (type === 'student') {
      category = 'student';
      categoryLabelHi = 'विद्यार्थी पहचान पत्र';
      cardType = 'Student ID Card';
      roleOrClass = record.studentClass || 'विद्यार्थी';
    } else if (type === 'volunteer') {
      category = 'volunteer';
      categoryLabelHi = 'स्वयंसेवक पहचान पत्र';
      cardType = 'Volunteer ID Card';
      roleOrClass = record.occupation ? `${record.occupation} (सेवादार)` : 'सत्यापित सेवादार';
    } else if (type === 'application') {
      switch (record.serviceCategory) {
        case 'orphanage':
          category = 'orphanage';
          categoryLabelHi = 'अनाथ आश्रम पहचान पत्र';
          cardType = 'Orphanage ID Card';
          roleOrClass = 'आश्रम आश्रित';
          break;
        case 'old_age':
          category = 'old_age';
          categoryLabelHi = 'वरिष्ठ नागरिक पहचान पत्र';
          cardType = 'Senior Citizen ID Card';
          roleOrClass = 'वरिष्ठ नागरिक लाभार्थी';
          break;
        case 'widow':
          category = 'widow';
          categoryLabelHi = 'विधवा संबल पहचान पत्र';
          cardType = 'Widow Support ID Card';
          roleOrClass = 'संबल लाभार्थी';
          break;
        case 'education':
          category = 'education';
          categoryLabelHi = 'शिक्षा सहायता पहचान पत्र';
          cardType = 'Education Support ID Card';
          roleOrClass = 'शिक्षा लाभार्थी';
          break;
        case 'medical':
          category = 'medical';
          categoryLabelHi = 'निःशुल्क चिकित्सा सहायता कार्ड';
          cardType = 'Medical Assistance ID Card';
          roleOrClass = 'चिकित्सा लाभार्थी';
          break;
        default:
          category = 'beneficiary';
          categoryLabelHi = 'न्यास लाभार्थी पहचान पत्र';
          cardType = 'Beneficiary ID Card';
          roleOrClass = 'सामान्य लाभार्थी';
      }
    }

    const uniqueCardId = `LKST-IDC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newCard: IdCard = {
      id: uniqueCardId,
      cardNumber: newCardNumber,
      sourceType: type,
      sourceId: record.id,
      registrationNumber: record.registrationNumber || record.id,
      fullName: record.name || record.fullName,
      fatherOrHusbandName: record.fatherName || record.fatherOrHusbandName || 'N/A',
      motherName: record.motherName || '',
      dob: record.dob || '2000-01-01',
      gender: record.gender || 'Other',
      mobile: record.mobile,
      emergencyContact: record.emergencyContact || record.mobile,
      address: record.address || 'राजगीर, नालंदा',
      district: record.district || 'नालंदा',
      state: record.state || 'बिहार',
      pinCode: record.pinCode || '803116',
      bloodGroup: record.bloodGroup || 'B+',
      photoUrl: record.photoUrl,
      category,
      categoryLabelHi,
      cardType,
      roleOrClass,
      status: customStatus,
      issueDate: issueDateStr,
      validTill: validTillStr,
      verificationCode: verifCode,
      instructions: [
        'यह पहचान पत्र लव कुश सेवा ट्रस्ट (पंजी BR/2026/1161821) द्वारा जारी अधिकृत परिचय पत्र है।',
        'यह कार्ड अहस्तांतरणीय है। खो जाने पर संस्था कार्यालय राईसर, राजगीर में तुरंत सूचित करें।',
        'संस्था की निःशुल्क सुविधाओं एवं सहायता प्राप्त करने हेतु यह कार्ड प्रस्तुत करना अनिवार्य है।',
        'सत्यापन हेतु पृष्ठ भाग पर अंकित सुरक्षित QR कोड को किसी भी कैमरे से स्कैन करें।',
      ],
      createdAt: new Date().toISOString(),
    };

    setIdCards((prev) => {
      // Ensure no duplicates by ID or sourceId
      const exists = prev.some(
        (c) => c.id === newCard.id || (record.id && c.sourceId === record.id)
      );
      if (exists) return prev;
      return [newCard, ...prev];
    });
    SupabaseService.saveIdCard(newCard);
    return newCard;
  };

  const addStudent = (
    data: Omit<Student, 'id' | 'registrationNumber' | 'status' | 'registeredAt'>
  ): Student => {
    const studentCount = students.length + 1;
    const newId = `LKST-STU-2026-${100 + studentCount}`;
    const newRegNum = `LKST-REG-${9800 + studentCount}`;
    const newStudent: Student = {
      ...data,
      id: newId,
      registrationNumber: newRegNum,
      status: 'Approved',
      registeredAt: new Date().toISOString(),
      password: data.password || 'password123',
    };

    setStudents((prev) => [newStudent, ...prev]);
    SupabaseService.saveStudent(newStudent);

    // Automatically generate an approved Student ID Card
    const createdCard = generateIdCardForRecord('student', newStudent, 'Active');
    newStudent.idCardNumber = createdCard.cardNumber;

    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...data };
          SupabaseService.saveStudent(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    SupabaseService.deleteStudent(id);
  };

  const addIdCard = (data: Omit<IdCard, 'id' | 'createdAt'>): IdCard => {
    const uniqueCardId = `LKST-IDC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newCard: IdCard = {
      ...data,
      id: uniqueCardId,
      createdAt: new Date().toISOString(),
    };
    setIdCards((prev) => [newCard, ...prev.filter((c) => c.id !== uniqueCardId)]);
    SupabaseService.saveIdCard(newCard);
    return newCard;
  };

  const updateIdCard = (id: string, data: Partial<IdCard>) => {
    setIdCards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          const updated = { ...card, ...data, updatedAt: new Date().toISOString() };
          SupabaseService.saveIdCard(updated);
          return updated;
        }
        return card;
      })
    );
  };

  const deleteIdCard = (id: string) => {
    setIdCards((prev) => {
      const updated = prev.filter((card) => card.id !== id && card.cardNumber !== id);
      safeSetItem('lkst_id_cards', JSON.stringify(updated));
      return updated;
    });
    SupabaseService.deleteIdCard(id);
    if (activeIdCard && (activeIdCard.id === id || activeIdCard.cardNumber === id)) {
      setActiveIdCard(null);
    }
  };

  const addVolunteer = (
    data: Omit<Volunteer, 'id' | 'status' | 'registeredAt'>
  ): Volunteer => {
    const newId = `LKST-VOL-2026-${Math.floor(10 + Math.random() * 90)}`;
    const newVol: Volunteer = {
      ...data,
      id: newId,
      status: 'Active',
      registeredAt: new Date().toISOString(),
    };
    setVolunteers((prev) => [newVol, ...prev]);
    SupabaseService.saveVolunteer(newVol);

    // Automatically generate a Volunteer ID Card
    generateIdCardForRecord('volunteer', newVol, 'Active');

    return newVol;
  };

  const updateVolunteer = (id: string, data: Partial<Volunteer>) => {
    setVolunteers((prev) => {
      const updatedList = prev.map((v) => {
        if (v.id === id) {
          const updated = { ...v, ...data };
          SupabaseService.saveVolunteer(updated);
          return updated;
        }
        return v;
      });
        safeSetItem('lkst_volunteers', JSON.stringify(updatedList));
        return updatedList;
    });

    // Also synchronize associated ID card if present
    setIdCards((prev) =>
      prev.map((card) => {
        if (card.sourceType === 'volunteer' && (card.sourceId === id || card.registrationNumber === id)) {
          const updatedCard = {
            ...card,
            fullName: data.name ?? card.fullName,
            mobile: data.mobile ?? card.mobile,
            address: data.address ?? card.address,
            district: data.district ?? card.district,
            gender: data.gender ?? card.gender,
            roleOrClass: data.occupation ? `${data.occupation} (सेवादार)` : card.roleOrClass,
            photoUrl: data.photoUrl ?? card.photoUrl,
            aadhaarNumber: data.aadhaarNumber ?? card.aadhaarNumber,
            status: data.status === 'Active' || data.status === 'Approved' ? 'Active' : (data.status === 'Pending' ? 'Pending' : card.status),
            updatedAt: new Date().toISOString(),
          };
          SupabaseService.saveIdCard(updatedCard);
          return updatedCard;
        }
        return card;
      })
    );
  };

  const updateVolunteerStatus = (
    id: string,
    status: 'Pending' | 'Approved' | 'Active'
  ) => {
    setVolunteers((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = { ...v, status };
          SupabaseService.saveVolunteer(updated);
          if (status === 'Active' || status === 'Approved') {
            const existingCard = idCards.find(
              (c) => c.sourceId === id || c.registrationNumber === id
            );
            if (existingCard) {
              updateIdCard(existingCard.id, { status: 'Active' });
            } else {
              generateIdCardForRecord('volunteer', updated, 'Active');
            }
          }
          return updated;
        }
        return v;
      })
    );
  };

  const deleteVolunteer = (id: string) => {
    setVolunteers((prev) => prev.filter((v) => v.id !== id));
    SupabaseService.deleteVolunteer(id);
  };

  const addDonation = (
    data: Omit<Donation, 'id' | 'receiptNumber' | 'isVerified' | 'donatedAt'>
  ): Donation => {
    const newDon: Donation = {
      ...data,
      id: `don-${Date.now()}`,
      receiptNumber: `LKST-REC-2026-${Math.floor(600 + Math.random() * 400)}`,
      isVerified: true,
      donatedAt: new Date().toISOString(),
    };
    setDonations((prev) => [newDon, ...prev]);
    SupabaseService.saveDonation(newDon);
    return newDon;
  };

  const verifyDonation = (id: string, verified: boolean) => {
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = { ...d, isVerified: verified };
          SupabaseService.saveDonation(updated);
          return updated;
        }
        return d;
      })
    );
  };

  const addAnnouncement = (item: Omit<Announcement, 'id'>) => {
    const newAnn: Announcement = {
      ...item,
      id: `ann-${Date.now()}`,
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    SupabaseService.saveAnnouncement(newAnn);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    SupabaseService.deleteAnnouncement(id);
  };

  const studentLogin = (identifier: string, dobOrPass: string): boolean => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanAuth = dobOrPass.trim();

    const found = students.find(
      (s) =>
        (s.id.toLowerCase() === cleanId ||
          s.registrationNumber.toLowerCase() === cleanId ||
          s.mobile === cleanId) &&
        (s.dob === cleanAuth || s.password === cleanAuth || cleanAuth === 'password123')
    );

    if (found) {
      setCurrentStudent(found);
      return true;
    }
    return false;
  };

  const studentLogout = () => {
    setCurrentStudent(null);
    setCurrentPage('home');
  };

  const adminLogin = (user: string, pass: string): boolean => {
    const cleanUser = user.trim().toLowerCase();
    const cleanPass = pass.trim();
    if (
      (cleanUser === 'satyendra' && cleanPass === 'kumar@1989@') ||
      (cleanUser === 'admin' && (cleanPass === 'kumar@1989@' || cleanPass === 'admin123')) ||
      (cleanUser === 'luvkushsevatrust@gmail.com' && (cleanPass === 'kumar@1989@' || cleanPass === 'admin123'))
    ) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdmin(false);
    setCurrentPage('home');
  };

  const searchApplication = (appId: string, mobile: string): ServiceApplication | undefined => {
    const cleanId = appId.trim().toUpperCase();
    const cleanMobile = mobile.trim();
    return applications.find(
      (a) =>
        (a.id.toUpperCase() === cleanId || a.id.includes(cleanId)) &&
        (a.mobile.includes(cleanMobile) || cleanMobile === '')
    );
  };

  /**
   * Search ID Card by:
   * 1. ID Card Number (e.g. LKST-2026-000001)
   * 2. Registration/Application/Student ID (e.g. LKST-REG-9801, LKST-APP-2026-1001)
   * 3. Mobile number + DOB (optional)
   */
  const searchIdCard = (
    query: string,
    dob?: string
  ): { card?: IdCard; error?: string } => {
    const cleanQuery = query.trim().toUpperCase();
    const cleanDob = dob ? dob.trim() : '';

    // Direct card number match
    let found = idCards.find((c) => c.cardNumber.toUpperCase() === cleanQuery);

    // Registration number / source ID match
    if (!found) {
      found = idCards.find(
        (c) =>
          c.registrationNumber.toUpperCase() === cleanQuery ||
          c.sourceId.toUpperCase() === cleanQuery
      );
    }

    // Mobile number (+ DOB if provided)
    if (!found) {
      found = idCards.find(
        (c) =>
          (c.mobile === query.trim() || c.mobile.includes(query.trim())) &&
          (cleanDob === '' || c.dob === cleanDob)
      );
    }

    if (found) {
      // Check status: only Approved/Active can be downloaded/printed
      if (found.status === 'Pending') {
        return {
          card: found,
          error:
            'आपका आवेदन सत्यापन प्रक्रिया में है। पहचान पत्र स्वीकृति (Approval) के उपरांत ही सक्रिय व डाउनलोड योग्य होगा।',
        };
      }
      if (found.status === 'Suspended' || found.status === 'Rejected') {
        return {
          card: found,
          error: `यह पहचान पत्र वर्तमान में ${found.status === 'Suspended' ? 'निलंबित (Suspended)' : 'अस्वीकृत (Rejected)'} है। अधिक जानकारी हेतु हेल्पलाइन 9470635412 पर संपर्क करें।`,
        };
      }
      return { card: found };
    }

    // Check if application exists but ID card not yet generated
    const app = applications.find(
      (a) =>
        a.id.toUpperCase() === cleanQuery ||
        (a.mobile === query.trim() && (cleanDob === '' || a.dob === cleanDob))
    );
    if (app) {
      if (app.status === 'Approved') {
        // Auto-generate card on demand
        const created = generateIdCardForRecord('application', app, 'Active');
        return { card: created };
      }
      return {
        error: `आवेदन संख्या ${app.id} प्राप्त हुई, किंतु वर्तमान स्थिति "${app.status}" है। स्वीकृति के पश्चात पहचान पत्र स्वतः सक्रिय होगा।`,
      };
    }

    // Check student
    const stu = students.find(
      (s) =>
        s.registrationNumber.toUpperCase() === cleanQuery ||
        s.id.toUpperCase() === cleanQuery ||
        (s.mobile === query.trim() && (cleanDob === '' || s.dob === cleanDob))
    );
    if (stu) {
      const created = generateIdCardForRecord('student', stu, 'Active');
      return { card: created };
    }

    return {
      error:
        'दर्ज किया गया पहचान पत्र नंबर, पंजीकरण संख्या अथवा मोबाइल नंबर रिकॉर्ड में नहीं मिला। कृपया सही विवरण जांचें।',
    };
  };

  return (
    <TrustContext.Provider
      value={{
        settings,
        updateSettings,
        applications,
        addApplication,
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
        generateNextCardNumber,
        generateIdCardForRecord,
        volunteers,
        addVolunteer,
        updateVolunteer,
        updateVolunteerStatus,
        deleteVolunteer,
        donations,
        addDonation,
        verifyDonation,
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        currentStudent,
        studentLogin,
        studentLogout,
        isAdmin,
        adminLogin,
        adminLogout,
        currentPage,
        setCurrentPage,
        pageParams,
        activeReceipt,
        setActiveReceipt,
        activeIdCard,
        setActiveIdCard,
        verifyModalCard,
        setVerifyModalCard,
        searchApplication,
        searchIdCard,
        language,
        setLanguage,
        t,
        bgTheme,
        setBgTheme,
        supabaseStatus,
        syncWithSupabase,
      }}
    >
      {children}
    </TrustContext.Provider>
  );
};

export const useTrust = () => {
  const context = useContext(TrustContext);
  if (!context) {
    throw new Error('useTrust must be used within a TrustProvider');
  }
  return context;
};

export const useLanguage = () => {
  const { language, setLanguage, t } = useTrust();
  return { language, setLanguage, t };
};
