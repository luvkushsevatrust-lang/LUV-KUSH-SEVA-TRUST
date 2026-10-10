import React, { useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { SafeImage } from './SafeImage';
import { TRUST_EMBLEM_LOGO } from '../assets';
import {
  Menu,
  X,
  Heart,
  CreditCard,
  Search,
  LogIn,
  GraduationCap,
  Shield,
  ChevronDown,
  LogOut,
  Home,
} from 'lucide-react';

interface NavbarProps {
  onOpenStatusModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStatusModal }) => {
  const {
    currentPage,
    setCurrentPage,
    isAdmin,
    adminLogout,
    currentStudent,
    studentLogout,
    language,
    t,
    settings,
  } = useTrust();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: t.nav.home },
    { id: 'about', label: t.nav.about },
    {
      id: 'services',
      label: t.nav.services,
      hasDropdown: true,
      items: [
        { id: 'service-orphanage', label: t.nav.orphanage },
        { id: 'service-oldage', label: t.nav.oldAge },
        { id: 'service-widow', label: t.nav.widow },
        { id: 'service-education', label: t.nav.education },
        { id: 'service-medical', label: t.nav.medical },
        { id: 'services', label: t.nav.allServices },
      ],
    },
    { id: 'volunteer-registration', label: t.nav.volunteer },
    { id: 'student-registration', label: t.nav.studentRegistration },
    { id: 'id-card', label: t.nav.idCard, icon: CreditCard },
    { id: 'contact', label: t.nav.contact },
  ];

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    setLoginDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-200/80 shadow-xs">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Mobile Left: Brand Logo & Title */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => handleNavClick('home')}
              className="inline-flex items-center gap-2 px-1.5 py-1 rounded-xl text-left hover:bg-orange-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 bg-white p-0.5 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                <SafeImage
                  src={settings.logoUrl || TRUST_EMBLEM_LOGO}
                  alt="Luv Kush Seva Trust Emblem"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="leading-tight">
                <span className="block text-xs font-black text-red-600 tracking-tight">LUV KUSH SEVA TRUST</span>
                <span className="block text-[10px] font-bold text-blue-900">{settings.nameHi}</span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Desktop Brand Logo pill */}
            <button
              onClick={() => handleNavClick('home')}
              className="mr-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-orange-50 transition-colors group cursor-pointer"
              title={language === 'en' ? 'Luv Kush Seva Trust - Home' : 'लव कुश सेवा ट्रस्ट - मुख्य पृष्ठ'}
            >
              <div className="w-8 h-8 rounded-full border border-amber-400 bg-white p-0.5 shadow-sm overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <SafeImage
                  src={settings.logoUrl || TRUST_EMBLEM_LOGO}
                  alt="Luv Kush Seva Trust Emblem"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="text-left leading-none hidden xl:block">
                <span className="block text-xs font-black text-red-600">LUV KUSH</span>
                <span className="block text-[9px] font-bold text-blue-900">SEVA TRUST</span>
              </div>
            </button>

            <nav className="flex items-center space-x-1 xl:space-x-1.5">
            {navLinks.map((link) => {
              const isActive =
                currentPage === link.id ||
                (link.items && link.items.some((item) => item.id === currentPage));

              if (link.hasDropdown) {
                return (
                  <div
                    key={link.id}
                    className="relative"
                    onMouseEnter={() => setServicesDropdownOpen(true)}
                    onMouseLeave={() => setServicesDropdownOpen(false)}
                  >
                    <button
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                        isActive
                          ? 'text-orange-600 bg-orange-50'
                          : 'text-stone-700 hover:text-orange-600 hover:bg-orange-50/60'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                    </button>

                    {servicesDropdownOpen && (
                      <div className="absolute top-full left-0 w-52 bg-white rounded-xl shadow-xl border border-stone-100 py-2 mt-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        {link.items?.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'text-orange-600 bg-orange-50 font-bold'
                      : 'text-stone-700 hover:text-orange-600 hover:bg-orange-50/60'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-orange-600" />}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

          {/* Action CTAs: Status Search + Donate + Login / Account */}
          <div className="hidden lg:flex items-center space-x-2.5">
            <button
              onClick={onOpenStatusModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-stone-700 hover:text-orange-600 hover:bg-orange-50 border border-stone-200 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-orange-600" />
              <span>{t.nav.appStatus}</span>
            </button>

            <button
              onClick={() => handleNavClick('donation')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg text-sm font-semibold shadow-xs hover:from-orange-700 hover:to-amber-700 hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>{t.nav.donate}</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className="px-3 py-2 text-sm font-semibold text-stone-700 hover:text-orange-600 bg-stone-100 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>{t.nav.adminDashboard}</span>
                </button>
                <button
                  onClick={adminLogout}
                  className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  title={t.nav.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentStudent ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavClick('student-dashboard')}
                  className="px-3 py-2 text-sm font-semibold text-stone-700 hover:text-orange-600 bg-stone-100 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>{t.nav.studentDashboard}</span>
                </button>
                <button
                  onClick={studentLogout}
                  className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  title={t.nav.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="relative"
                onMouseEnter={() => setLoginDropdownOpen(true)}
                onMouseLeave={() => setLoginDropdownOpen(false)}
              >
                <button className="px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:text-orange-600 hover:bg-orange-50 border border-stone-200 inline-flex items-center space-x-1.5 cursor-pointer">
                  <LogIn className="w-4 h-4" />
                  <span>{t.nav.login}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {loginDropdownOpen && (
                  <div className="absolute top-full right-0 w-48 bg-white rounded-xl shadow-xl border border-stone-100 py-2 mt-1 z-50">
                    <button
                      onClick={() => handleNavClick('student-login')}
                      className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-orange-50 hover:text-orange-600 flex items-center space-x-2 cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>{t.nav.studentLogin}</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('admin-login')}
                      className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-orange-50 hover:text-orange-600 flex items-center space-x-2 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>{t.nav.adminLogin}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button & Quick Actions */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => handleNavClick('donation')}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>{t.nav.donate}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-orange-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-6 space-y-1 shadow-xl animate-in slide-in-from-top-2">
          {/* Quick status check button on mobile */}
          <div className="flex items-center gap-2 pb-3 mb-2 border-b border-stone-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenStatusModal();
              }}
              className="flex-1 py-2 px-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t.nav.appStatus}</span>
            </button>
            <button
              onClick={() => handleNavClick('id-card')}
              className="flex-1 py-2 px-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-700" />
              <span>{t.nav.idCard}</span>
            </button>
          </div>

          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === item.id ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-stone-700'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="pt-3 border-t border-stone-100 flex flex-col space-y-2">
            {isAdmin ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className="w-full py-2.5 bg-stone-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>{t.nav.adminDashboard}</span>
                </button>
                <button
                  onClick={adminLogout}
                  className="w-full py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.admin.logoutBtn}</span>
                </button>
              </div>
            ) : currentStudent ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick('student-dashboard')}
                  className="w-full py-2.5 bg-blue-900 text-white rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span>{t.nav.studentDashboard}</span>
                </button>
                <button
                  onClick={studentLogout}
                  className="w-full py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.student.logout}</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('student-login')}
                  className="w-full py-2.5 bg-stone-100 text-stone-800 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>{t.nav.studentLogin}</span>
                </button>
                <button
                  onClick={() => handleNavClick('admin-login')}
                  className="w-full py-2.5 bg-stone-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>{t.nav.adminLogin}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

