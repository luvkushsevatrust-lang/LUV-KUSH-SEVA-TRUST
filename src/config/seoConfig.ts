/**
 * SEO & Social Sharing Metadata Configuration for Luv Kush Seva Trust
 * Official Domain: https://www.luvkushsevatrust.in/
 * Location: Raispar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar
 * Verified Registration: BR/2026/1161821
 */

export const SITE_DOMAIN = 'https://www.luvkushsevatrust.in';
export const DEFAULT_OG_IMAGE = `${SITE_DOMAIN}/trust_logo_round.png`;

export interface PageSEO {
  path: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  keywords: string;
  ogType?: 'website' | 'article';
  priority?: number;
  noindex?: boolean;
}

export const VERIFIED_ORGANIZATION = {
  name: 'Luv Kush Seva Trust',
  nameHi: 'लव कुश सेवा ट्रस्ट',
  registrationNumber: 'BR/2026/1161821',
  founder: 'Satyendra Kumar',
  founderTitle: 'Founder & Chairperson',
  address: {
    street: 'Raispar, Near Cricket Stadium',
    locality: 'Rajgir',
    district: 'Nalanda',
    state: 'Bihar',
    postalCode: '803116',
    country: 'IN',
  },
  geo: {
    latitude: 25.0268991,
    longitude: 85.369943,
    mapsUrl: 'https://maps.app.goo.gl/j2cbsCrhfuss2cwK7',
  },
  phone: '+91-9570997162',
  email: 'luvkushsevatrust@gmail.com',
  website: SITE_DOMAIN,
  logo: `${SITE_DOMAIN}/trust_logo_round.png`,
};

export const PAGE_SEO_CONFIG: Record<string, PageSEO> = {
  home: {
    path: '/',
    title: 'Luv Kush Seva Trust | NGO in Rajgir, Nalanda, Bihar',
    titleHi: 'लव कुश सेवा ट्रस्ट, राजगीर | सेवा ही संकल्प, मानवता ही धर्म',
    description:
      'Luv Kush Seva Trust (Reg. BR/2026/1161821) in Rajgir, Nalanda, Bihar offers orphan care, old-age support, widow aid, free education & medical camps.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) - अनाथ आश्रम, वृद्ध आश्रम, विधवा सहायता, निःशुल्क शिक्षा एवं चिकित्सा सेवा। पंजी. BR/2026/1161821।',
    keywords:
      'Luv Kush Seva Trust, लव कुश सेवा ट्रस्ट, NGO in Rajgir, NGO in Nalanda, NGO in Bihar, charitable trust Bihar, free education NGO Rajgir, Satyendra Kumar Rajgir, orphan care NGO Bihar, old age home Rajgir',
    ogType: 'website',
  },
  about: {
    path: '/about',
    title: 'About Us | Luv Kush Seva Trust – Rajgir, Nalanda, Bihar',
    titleHi: 'हमारे बारे में | लव कुश सेवा ट्रस्ट – राजगीर, नालंदा, बिहार',
    description:
      'Learn about Luv Kush Seva Trust in Rajgir, Nalanda, Bihar, founded by Satyendra Kumar to serve orphans, seniors, widows, and underprivileged students.',
    descriptionHi:
      'सत्येन्द्र कुमार द्वारा स्थापित लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) के इतिहास, उद्देश्य, मिशन एवं सेवा कार्यों के बारे में जानें।',
    keywords:
      'About Luv Kush Seva Trust, Satyendra Kumar Founder, NGO in Rajgir Nalanda Bihar, social welfare organisation Bihar, humanitarian charity Rajgir',
    ogType: 'article',
  },
  services: {
    path: '/services',
    title: 'Social Welfare Services | Luv Kush Seva Trust Rajgir',
    titleHi: 'सेवा प्रकल्प | लव कुश सेवा ट्रस्ट – राजगीर, नालंदा',
    description:
      'Explore Luv Kush Seva Trust welfare programs in Rajgir, Nalanda, Bihar: orphan care, old-age shelter, widow support, free education & medical camps.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर के 5 प्रमुख सेवा प्रकल्प: अनाथ आश्रम, वृद्ध आश्रम, विधवा कल्याण, निःशुल्क शिक्षा एवं चिकित्सा शिविर की जानकारी।',
    keywords:
      'social welfare Rajgir Bihar, free education Nalanda, orphan care NGO Bihar, old age care Rajgir, widow welfare Bihar, free medical camp Nalanda',
    ogType: 'website',
  },
  donation: {
    path: '/donation',
    title: 'Donate & Support | Luv Kush Seva Trust, Rajgir, Bihar',
    titleHi: 'दान एवं सहयोग | लव कुश सेवा ट्रस्ट – राजगीर, नालंदा',
    description:
      'Donate online to Luv Kush Seva Trust, Rajgir (Nalanda, Bihar). Your support funds orphan care, free books, meals, and medical camps with instant receipt.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) को ऑनलाइन दान दें। अनाथ बच्चों की शिक्षा, भोजन व वृद्ध सेवा में सहयोग करें और तुरंत रसीद पाएं।',
    keywords:
      'donate to NGO Bihar, support Luv Kush Seva Trust, charity donation Rajgir Nalanda, food donation Bihar, child education sponsorship Rajgir',
    ogType: 'website',
  },
  membership: {
    path: '/membership',
    title: 'Life Membership | Luv Kush Seva Trust – Rajgir, Bihar',
    titleHi: 'आजीवन सदस्यता | लव कुश सेवा ट्रस्ट – राजगीर, नालंदा',
    description:
      'Apply online for Luv Kush Seva Trust Life Membership in Rajgir, Nalanda, Bihar. Complete registration via Razorpay and receive receipt & ID card.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) की आजीवन सदस्यता हेतु ऑनलाइन आवेदन करें। भुगतान के बाद आधिकारिक रसीद एवं पहचान पत्र प्राप्त करें।',
    keywords:
      'Luv Kush Seva Trust membership, NGO life membership Bihar, Rajgir Nalanda NGO member, trust member ID card Bihar',
    ogType: 'website',
  },
  'volunteer-registration': {
    path: '/volunteer-registration',
    title: 'Volunteer Registration | Luv Kush Seva Trust Rajgir',
    titleHi: 'स्वयंसेवक पंजीकरण | लव कुश सेवा ट्रस्ट – राजगीर, बिहार',
    description:
      'Join as a volunteer with Luv Kush Seva Trust in Rajgir, Nalanda, Bihar. Support free education, health camps, and community welfare drives.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) के साथ स्वयंसेवक बनकर समाज सेवा करें। ऑनलाइन पंजीकरण करें और आधिकारिक पहचान पत्र पाएं।',
    keywords:
      'volunteer registration NGO Bihar, social work volunteer Rajgir Nalanda, community social welfare Bihar, Luv Kush Seva Trust volunteers',
    ogType: 'website',
  },
  'student-registration': {
    path: '/student-registration',
    title: 'Free Education Registration | Luv Kush Seva Trust Bihar',
    titleHi: 'निःशुल्क शिक्षा छात्र पंजीकरण | लव कुश सेवा ट्रस्ट, राजगीर',
    description:
      'Apply for free schooling, books, uniforms, and coaching under Luv Kush Seva Trust Free Education Initiative in Rajgir, Nalanda, Bihar.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) निःशुल्क शिक्षा प्रकल्प के अंतर्गत छात्र पंजीकरण करें। मुफ्त पुस्तकें, कोचिंग एवं मार्गदर्शन।',
    keywords:
      'free education registration Rajgir, student support NGO Nalanda Bihar, underprivileged student coaching Bihar, Luv Kush Seva Trust education',
    ogType: 'website',
  },
  'orphanage-registration': {
    path: '/orphanage-registration',
    title: 'Orphanage Care Registration | Luv Kush Seva Trust Rajgir',
    titleHi: 'अनाथ आश्रम सेवा पंजीकरण | लव कुश सेवा ट्रस्ट, राजगीर',
    description:
      'Register an orphaned or destitute child for shelter, nutrition, and education at Luv Kush Seva Trust, Rajgir, Nalanda, Bihar.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) के अनाथ आश्रम सेवा प्रकल्प में आवास, पोषण और शिक्षा सहायता हेतु ऑनलाइन पंजीकरण करें।',
    keywords:
      'orphanage care Rajgir, orphan child help Nalanda Bihar, Luv Kush Seva Trust orphanage',
    ogType: 'website',
  },
  'old-age-registration': {
    path: '/old-age-registration',
    title: 'Old Age Care Registration | Luv Kush Seva Trust Rajgir',
    titleHi: 'वृद्ध आश्रम सेवा पंजीकरण | लव कुश सेवा ट्रस्ट, राजगीर',
    description:
      'Apply for elderly care, shelter, meals, and healthcare support with Luv Kush Seva Trust in Rajgir, Nalanda, Bihar.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) के वृद्ध आश्रम सेवा प्रकल्प के अंतर्गत बुजुर्गों की देखरेख व आश्रय हेतु पंजीकरण करें।',
    keywords:
      'old age care Rajgir, vridhashram Nalanda Bihar, elderly support Luv Kush Seva Trust',
    ogType: 'website',
  },
  'widow-registration': {
    path: '/widow-registration',
    title: 'Widow Welfare Registration | Luv Kush Seva Trust Rajgir',
    titleHi: 'विधवा आश्रम एवं सहायता पंजीकरण | लव कुश सेवा ट्रस्ट',
    description:
      'Apply for widow welfare assistance, skill support, and shelter through Luv Kush Seva Trust in Rajgir, Nalanda, Bihar.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) के विधवा कल्याण प्रकल्प के अंतर्गत सहायता व आत्मनिर्भरता हेतु ऑनलाइन पंजीकरण करें।',
    keywords:
      'widow welfare Rajgir Bihar, widow support NGO Nalanda, Luv Kush Seva Trust widow care',
    ogType: 'website',
  },
  'education-registration': {
    path: '/education-registration',
    title: 'Education Support Form | Luv Kush Seva Trust Rajgir',
    titleHi: 'शिक्षा सहायता पंजीकरण | लव कुश सेवा ट्रस्ट – राजगीर',
    description:
      'Register for free books, study kits, and educational guidance from Luv Kush Seva Trust in Rajgir, Nalanda, Bihar.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) द्वारा संचालित निःशुल्क शिक्षा सहायता एवं अध्ययन सामग्री हेतु ऑनलाइन आवेदन करें।',
    keywords:
      'free education help Rajgir, study kit NGO Nalanda Bihar, Luv Kush Seva Trust',
    ogType: 'website',
  },
  'medical-registration': {
    path: '/medical-registration',
    title: 'Medical Aid Registration | Luv Kush Seva Trust Rajgir',
    titleHi: 'निःशुल्क चिकित्सा सहायता पंजीकरण | लव कुश सेवा ट्रस्ट',
    description:
      'Request free medical camp checkups, medicines, and health assistance from Luv Kush Seva Trust in Rajgir, Nalanda, Bihar.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) के निःशुल्क चिकित्सा एवं स्वास्थ्य सहायता प्रकल्प के लिए ऑनलाइन पंजीकरण करें।',
    keywords:
      'free medical aid Rajgir, health camp NGO Nalanda Bihar, Luv Kush Seva Trust medical',
    ogType: 'website',
  },
  careers: {
    path: '/careers',
    title: 'Careers & Seva Roles | Luv Kush Seva Trust – Rajgir, Bihar',
    titleHi: 'करियर एवं सेवा अवसर | लव कुश सेवा ट्रस्ट – राजगीर, नालंदा',
    description:
      'Explore teaching, social work, and coordinator opportunities with Luv Kush Seva Trust in Rajgir, Nalanda, Bihar.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर (नालंदा, बिहार) के शिक्षा, चिकित्सा और सामाजिक सेवा प्रकल्पों में कार्य व सेवा अवसरों की जानकारी देखें।',
    keywords:
      'NGO jobs Rajgir Bihar, Luv Kush Seva Trust careers, social worker Nalanda Bihar',
    ogType: 'website',
  },
  'id-card': {
    path: '/id-card',
    title: 'ID Card Portal & Verification | Luv Kush Seva Trust',
    titleHi: 'पहचान पत्र पोर्टल एवं सत्यापन | लव कुश सेवा ट्रस्ट',
    description:
      'Verify and download official QR-enabled digital ID cards for members, volunteers, and students of Luv Kush Seva Trust, Rajgir, Bihar.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट, राजगीर डिजिटल पहचान पत्र (ID Card) पोर्टल। कार्ड नंबर या मोबाइल नंबर से खोजें, QR कोड द्वारा सत्यापन करें व डाउनलोड करें।',
    keywords:
      'Luv Kush Seva Trust ID card, NGO id card verification Bihar, volunteer card download Rajgir, student id card QR verify',
    ogType: 'website',
  },
  contact: {
    path: '/contact',
    title: 'Contact Us | Luv Kush Seva Trust – Rajgir, Nalanda, Bihar',
    titleHi: 'संपर्क करें | लव कुश सेवा ट्रस्ट – राजगीर, नालंदा, बिहार',
    description:
      'Contact Luv Kush Seva Trust at Raispar, Near Cricket Stadium, Rajgir - 803116, Nalanda, Bihar. Helpline: +91 9570997162.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट से संपर्क करें: राइसपर, क्रिकेट स्टेडियम के पास, राजगीर – 803116, नालंदा, बिहार। हेल्पलाइन: 9570997162।',
    keywords:
      'contact Luv Kush Seva Trust, NGO Rajgir Nalanda, Luv Kush Seva Trust phone number, luvkushsevatrust@gmail.com, Raispar Rajgir NGO',
    ogType: 'website',
  },
  'privacy-policy': {
    path: '/privacy-policy',
    title: 'Privacy Policy | Luv Kush Seva Trust – Rajgir, Bihar',
    titleHi: 'गोपनीयता नीति | लव कुश सेवा ट्रस्ट – राजगीर, नालंदा',
    description:
      'Read the Privacy Policy of Luv Kush Seva Trust, Rajgir, Bihar on how we protect donor, member, volunteer, and student data.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट गोपनीयता नीति - दानदाताओं, सदस्यों, स्वयंसेवकों एवं छात्रों के डेटा की सुरक्षा तथा गोपनीयता की प्रतिबद्धता।',
    keywords:
      'privacy policy Luv Kush Seva Trust, NGO donor privacy Bihar, luvkushsevatrust.in privacy',
    ogType: 'website',
  },
  terms: {
    path: '/terms',
    title: 'Terms & Conditions | Luv Kush Seva Trust – Rajgir, Bihar',
    titleHi: 'नियम एवं शर्तें | लव कुश सेवा ट्रस्ट – राजगीर, नालंदा',
    description:
      'Review official terms of service, online donation rules, and membership guidelines for Luv Kush Seva Trust, Rajgir, Bihar.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट नियम व शर्तें - पोर्टल उपयोग, ऑनलाइन दान, सदस्यता एवं कल्याणकारी सेवाओं से संबंधित आधिकारिक दिशा-निर्देश।',
    keywords:
      'terms and conditions, NGO donation policy Bihar, Luv Kush Seva Trust terms, Rajgir trust guidelines',
    ogType: 'website',
  },
  login: {
    path: '/login',
    title: 'Portal Login | Luv Kush Seva Trust',
    titleHi: 'पोर्टल लॉगिन | लव कुश सेवा ट्रस्ट',
    description: 'Portal login for Luv Kush Seva Trust.',
    descriptionHi: 'लव कुश सेवा ट्रस्ट पोर्टल लॉगिन।',
    keywords: 'Luv Kush Seva Trust login',
    noindex: true,
  },
  'student-login': {
    path: '/student-login',
    title: 'Student Login | Luv Kush Seva Trust',
    titleHi: 'छात्र लॉगिन | लव कुश सेवा ट्रस्ट',
    description: 'Student portal login for Luv Kush Seva Trust.',
    descriptionHi: 'लव कुश सेवा ट्रस्ट छात्र पोर्टल लॉगिन।',
    keywords: 'Luv Kush Seva Trust student login',
    noindex: true,
  },
  'student-dashboard': {
    path: '/student-dashboard',
    title: 'Student Dashboard | Luv Kush Seva Trust',
    titleHi: 'छात्र डैशबोर्ड | लव कुश सेवा ट्रस्ट',
    description: 'Student portal dashboard for Luv Kush Seva Trust.',
    descriptionHi: 'लव कुश सेवा ट्रस्ट छात्र डैशबोर्ड।',
    keywords: 'Luv Kush Seva Trust student dashboard',
    noindex: true,
  },
  'admin-login': {
    path: '/admin-login',
    title: 'Admin Login | Luv Kush Seva Trust',
    titleHi: 'एडमिन लॉगिन | लव कुश सेवा ट्रस्ट',
    description: 'Administrative login for Luv Kush Seva Trust.',
    descriptionHi: 'लव कुश सेवा ट्रस्ट एडमिन लॉगिन।',
    keywords: 'Luv Kush Seva Trust admin login',
    noindex: true,
  },
  'admin-dashboard': {
    path: '/admin-dashboard',
    title: 'Admin Dashboard | Luv Kush Seva Trust',
    titleHi: 'एडमिन डैशबोर्ड | लव कुश सेवा ट्रस्ट',
    description: 'Administrative dashboard for Luv Kush Seva Trust.',
    descriptionHi: 'लव कुश सेवा ट्रस्ट एडमिन डैशबोर्ड।',
    keywords: 'Luv Kush Seva Trust admin dashboard',
    noindex: true,
  },
};

/**
 * Generate Schema.org Organization Structured Data (JSON-LD)
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['NGO', 'NonProfitOrganization', 'Charity'],
        '@id': `${SITE_DOMAIN}/#organization`,
        name: VERIFIED_ORGANIZATION.name,
        alternateName: [
          VERIFIED_ORGANIZATION.nameHi,
          'LKST',
          'Luv Kush Seva Trust Rajgir',
        ],
        url: SITE_DOMAIN,
        logo: {
          '@type': 'ImageObject',
          url: VERIFIED_ORGANIZATION.logo,
          caption: 'Luv Kush Seva Trust Official Emblem',
        },
        image: VERIFIED_ORGANIZATION.logo,
        description:
          'Luv Kush Seva Trust is a government-registered non-profit charitable organisation in Rajgir, Nalanda, Bihar carrying out social welfare activities, helping underprivileged people with free education, healthcare, and humanitarian care.',
        taxID: VERIFIED_ORGANIZATION.registrationNumber,
        identifier: VERIFIED_ORGANIZATION.registrationNumber,
        founder: {
          '@type': 'Person',
          name: VERIFIED_ORGANIZATION.founder,
          jobTitle: VERIFIED_ORGANIZATION.founderTitle,
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: VERIFIED_ORGANIZATION.address.street,
          addressLocality: VERIFIED_ORGANIZATION.address.locality,
          addressRegion: VERIFIED_ORGANIZATION.address.state,
          postalCode: VERIFIED_ORGANIZATION.address.postalCode,
          addressCountry: VERIFIED_ORGANIZATION.address.country,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: VERIFIED_ORGANIZATION.geo.latitude,
          longitude: VERIFIED_ORGANIZATION.geo.longitude,
        },
        hasMap: VERIFIED_ORGANIZATION.geo.mapsUrl,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: VERIFIED_ORGANIZATION.phone,
            contactType: 'customer support',
            email: VERIFIED_ORGANIZATION.email,
            areaServed: ['IN'],
            availableLanguage: ['Hindi', 'English'],
          },
        ],
        areaServed: [
          { '@type': 'AdministrativeArea', name: 'Rajgir' },
          { '@type': 'AdministrativeArea', name: 'Nalanda' },
          { '@type': 'AdministrativeArea', name: 'Bihar' },
          { '@type': 'Country', name: 'India' },
        ],
        knowsAbout: [
          'Social Welfare Activities',
          'Free Education for Underprivileged Children',
          'Free Healthcare Medical Camps',
          'Orphanage Care and Support',
          'Elderly and Old Age Care',
          'Widow Welfare Assistance',
          'Helping Underprivileged People',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_DOMAIN}/#website`,
        url: SITE_DOMAIN,
        name: VERIFIED_ORGANIZATION.name,
        publisher: {
          '@id': `${SITE_DOMAIN}/#organization`,
        },
        inLanguage: ['hi', 'en'],
      },
    ],
  };
}

/**
 * Generate BreadcrumbList Schema for a specific page
 */
export function getBreadcrumbSchema(pageKey: string) {
  const page = PAGE_SEO_CONFIG[pageKey] || PAGE_SEO_CONFIG.home;
  if (pageKey === 'home') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_DOMAIN,
        },
      ],
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_DOMAIN,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.title.split('|')[0].trim(),
        item: `${SITE_DOMAIN}${page.path}`,
      },
    ],
  };
}
