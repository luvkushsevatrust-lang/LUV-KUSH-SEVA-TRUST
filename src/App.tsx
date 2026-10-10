import React, { useState } from 'react';
import { TrustProvider, useTrust } from './context/TrustContext';
import { TrustBannerHeader } from './components/TrustBannerHeader';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ApplicationStatusModal } from './components/ApplicationStatusModal';
import { PrintableReceipt } from './components/PrintableReceipt';
import { PrintableIdCard } from './components/PrintableIdCard';
import { IdCardVerificationModal } from './components/IdCardVerificationModal';
import { SEOHead } from './components/SEOHead';

// Pages
import { HomePage } from './pages/HomePage';
import { AboutPage, ServicesPage } from './pages/AboutPage';
import { ServiceRegistrationPage } from './pages/ServiceRegistrationPage';
import { VolunteerRegistrationPage } from './pages/VolunteerRegistrationPage';
import { DonationPage } from './pages/DonationPage';
import { StudentRegistrationPage } from './pages/StudentRegistrationPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { IdCardPortalPage } from './pages/IdCardPortalPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { BG_THEMES } from './data/bgThemeConfig';

const AppContent: React.FC = () => {
  const {
    currentPage,
    activeIdCard,
    setActiveIdCard,
    verifyModalCard,
    setVerifyModalCard,
    bgTheme,
  } = useTrust();
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const currentTheme = BG_THEMES[bgTheme] || BG_THEMES.sandalwood;

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'about':
        return <AboutPage />;
      case 'services':
        return <ServicesPage />;
      case 'orphanage-registration':
        return <ServiceRegistrationPage initialCategory="orphanage" />;
      case 'old-age-registration':
        return <ServiceRegistrationPage initialCategory="old_age" />;
      case 'widow-registration':
        return <ServiceRegistrationPage initialCategory="widow" />;
      case 'education-registration':
        return <ServiceRegistrationPage initialCategory="education" />;
      case 'medical-registration':
        return <ServiceRegistrationPage initialCategory="medical" />;
      case 'volunteer-registration':
        return <VolunteerRegistrationPage />;
      case 'donation':
        return <DonationPage />;
      case 'student-registration':
        return <StudentRegistrationPage />;
      case 'student-login':
        return <StudentLoginPage />;
      case 'student-dashboard':
        return <StudentDashboardPage />;
      case 'id-card':
      case 'admit-card': // legacy alias safely mapped to ID card portal
        return <IdCardPortalPage />;
      case 'contact':
        return <ContactPage />;
      case 'login':
        return <LoginPage />;
      case 'admin-login':
        return <AdminLoginPage />;
      case 'admin-dashboard':
        return <AdminDashboardPage />;
      case 'privacy-policy':
        return <PrivacyPolicyPage />;
      case 'terms':
        return <TermsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col text-slate-800 transition-colors duration-300"
      style={{ backgroundColor: currentTheme.bgHex }}
    >
      {/* Dynamic SEO & Social Metadata Head */}
      <SEOHead />

      {/* Top Authentic Banner - faithful to uploaded reference */}
      <div className="no-print">
        <TrustBannerHeader />
        <Navbar onOpenStatusModal={() => setStatusModalOpen(true)} />
      </div>

      {/* Main Dynamic View */}
      <main className={`flex-1 ${activeIdCard ? 'no-print' : ''}`}>
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals & Dialogs */}
      <ApplicationStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
      />

      <PrintableReceipt />

      {/* ID Card Print & Wallet Viewer Modal */}
      <PrintableIdCard
        card={activeIdCard}
        onClose={() => setActiveIdCard(null)}
      />

      {/* ID Card Security Verification Modal */}
      <IdCardVerificationModal
        card={verifyModalCard}
        onClose={() => setVerifyModalCard(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <TrustProvider>
      <AppContent />
    </TrustProvider>
  );
}
