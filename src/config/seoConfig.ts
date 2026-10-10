/**
 * SEO & Social Sharing Metadata Configuration for Luv Kush Seva Trust
 * Official Domain: https://www.luvkushsevatrust.in/
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
}

export const VERIFIED_ORGANIZATION = {
  name: 'Luv Kush Seva Trust',
  nameHi: 'लव कुश सेवा ट्रस्ट',
  registrationNumber: 'BR/2026/1161821',
  founder: 'Satyendra Kumar',
  founderTitle: 'Founder & Chairperson',
  address: {
    street: 'Raisar, Near Cricket Stadium',
    locality: 'Rajgir',
    district: 'Nalanda',
    state: 'Bihar',
    postalCode: '803116',
    country: 'IN',
  },
  phone: '+91-9570997162',
  email: 'luvkushsevatrust@gmail.com',
  website: SITE_DOMAIN,
  logo: `${SITE_DOMAIN}/trust_logo_round.png`,
};

export const PAGE_SEO_CONFIG: Record<string, PageSEO> = {
  home: {
    path: '/',
    title: 'Luv Kush Seva Trust | NGO in Odisha & Bihar - Social Welfare Activities',
    titleHi: 'लव कुश सेवा ट्रस्ट | सेवा ही संकल्प, मानवता ही हमारा धर्म',
    description:
      'Luv Kush Seva Trust is a registered NGO carrying out social welfare activities, helping underprivileged people with free education, medical camps, orphanage & elder care.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट (पंजी. BR/2026/1161821) - अनाथ आश्रम, वृद्ध आश्रम, विधवा सहायता, निःशुल्क शिक्षा एवं चिकित्सा सेवा। सेवा ही संकल्प, मानवता ही हमारा धर्म।',
    keywords:
      'Luv Kush Seva Trust, लव कुश सेवा ट्रस्ट, NGO in Odisha, social welfare activities, helping underprivileged people, charitable trust Bihar, free education NGO, Satyendra Kumar Rajgir',
    ogType: 'website',
  },
  about: {
    path: '/about',
    title: 'About Us | Luv Kush Seva Trust - Mission, Vision & Leadership',
    titleHi: 'हमारे बारे में | लव कुश सेवा ट्रस्ट - उद्देश्य एवं विचारधारा',
    description:
      'Learn about Luv Kush Seva Trust founded by Satyendra Kumar. Dedicated to selfless service, human dignity, and helping underprivileged communities across regions.',
    descriptionHi:
      'सत्येन्द्र कुमार द्वारा स्थापित लव कुश सेवा ट्रस्ट के इतिहास, उद्देश्य, मिशन एवं निस्वार्थ सेवा कार्यों के बारे में विस्तार से जानें।',
    keywords:
      'About Luv Kush Seva Trust, Satyendra Kumar Founder, NGO mission, humanitarian charity, social welfare organisation, Rajgir Nalanda',
    ogType: 'article',
  },
  services: {
    path: '/services',
    title: 'Social Welfare Services | Luv Kush Seva Trust - Free Education & Care',
    titleHi: 'सेवा प्रकल्प | लव कुश सेवा ट्रस्ट - अनाथ, वृद्ध, विधवा एवं शिक्षा सेवा',
    description:
      'Explore core social welfare activities by Luv Kush Seva Trust: orphan care, elderly assistance, widow welfare, free coaching, and free healthcare camps.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट के 5 प्रमुख सेवा प्रकल्प: अनाथालय, वृद्धाश्रम, विधवा कल्याण, निःशुल्क शिक्षा एवं चिकित्सा सहायता की विस्तृत जानकारी।',
    keywords:
      'social welfare activities, free education for poor children, orphan care NGO, old age care trust, widow support, free medical camp, helping underprivileged people',
    ogType: 'website',
  },
  donation: {
    path: '/donation',
    title: 'Donate & Support | Luv Kush Seva Trust - Help Underprivileged People',
    titleHi: 'दान एवं सहयोग | लव कुश सेवा ट्रस्ट - सेवा में भागीदार बनें',
    description:
      'Support Luv Kush Seva Trust charitable missions. Your donation directly funds orphan care, student schooling, medicine for seniors, and food distribution.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट को ऑनलाइन दान देकर अनाथ बच्चों की शिक्षा, वृद्धजनों की देखरेख एवं जरूरतमंदों के भोजन में अपना अमूल्य सहयोग दें। तुरंत रसीद प्राप्त करें।',
    keywords:
      'donate to NGO, support underprivileged people, charity donation India, Luv Kush Seva Trust donation, food donation, child education sponsorship',
    ogType: 'website',
  },
  'volunteer-registration': {
    path: '/volunteer-registration',
    title: 'Join as a Volunteer | Luv Kush Seva Trust - Community Social Work',
    titleHi: 'स्वयंसेवक बनें | लव कुश सेवा ट्रस्ट - समाज सेवा हेतु पंजीकरण',
    description:
      'Become a volunteer with Luv Kush Seva Trust. Join dedicated changemakers participating in educational, medical, and community social welfare activities.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट के साथ जुड़कर निस्वार्थ समाज सेवा करें। ऑनलाइन स्वयंसेवक पंजीकरण करें और आधिकारिक प्रमाण पत्र व आईडी प्राप्त करें।',
    keywords:
      'volunteer registration NGO, social work volunteer, youth volunteer NGO in Odisha and Bihar, community social welfare, Luv Kush Seva Trust volunteers',
    ogType: 'website',
  },
  'student-registration': {
    path: '/student-registration',
    title: 'Free Education Student Registration | Luv Kush Seva Trust',
    titleHi: 'निःशुल्क शिक्षा छात्र पंजीकरण | लव कुश सेवा ट्रस्ट',
    description:
      'Apply for free schooling, study books, uniforms, and mentoring for underprivileged students under the Luv Kush Seva Trust Free Education Initiative.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट निःशुल्क शिक्षा प्रकल्प के अंतर्गत छात्र-छात्राओं का ऑनलाइन प्रवेश फॉर्म। जरूरतमंद बच्चों को मुफ्त शिक्षा, पुस्तकें व मार्गदर्शन।',
    keywords:
      'free education registration, student scholarship NGO, underprivileged student education, free study coaching, Luv Kush Seva Trust education',
    ogType: 'website',
  },
  'id-card': {
    path: '/id-card',
    title: 'Official ID Card Portal & Verification | Luv Kush Seva Trust',
    titleHi: 'पहचान पत्र पोर्टल एवं सत्यापन | लव कुश सेवा ट्रस्ट',
    description:
      'Verify and download official digital ID cards for volunteers, students, and beneficiaries of Luv Kush Seva Trust with secure QR verification.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट डिजिटल पहचान पत्र (ID Card) पोर्टल। कार्ड नंबर या मोबाइल नंबर से खोजें, क्यूआर कोड द्वारा सत्यापन करें व डिजिटल कार्ड डाउनलोड करें।',
    keywords:
      'Luv Kush Seva Trust ID card, NGO id card verification, volunteer card download, student id card verification, QR code card verify',
    ogType: 'website',
  },
  contact: {
    path: '/contact',
    title: 'Contact Us | Luv Kush Seva Trust - Office, Helpline & Location',
    titleHi: 'संपर्क करें | लव कुश सेवा ट्रस्ट - कार्यालय, हेल्पलाइन एवं पता',
    description:
      'Get in touch with Luv Kush Seva Trust. Office at Raisar, Near Cricket Stadium, Rajgir (Nalanda), Bihar 803116. Phone: 9570997162, Email: luvkushsevatrust@gmail.com.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट से संपर्क करें: राईसर, क्रिकेट स्टेडियम के समीप, राजगीर (नालंदा) बिहार। 24x7 हेल्पलाइन: 9570997162, ईमेल: luvkushsevatrust@gmail.com।',
    keywords:
      'contact Luv Kush Seva Trust, NGO Rajgir Nalanda, NGO phone number, luvkushsevatrust@gmail.com, Satyendra Kumar contact, NGO address Bihar',
    ogType: 'website',
  },
  'privacy-policy': {
    path: '/privacy-policy',
    title: 'Privacy Policy | Luv Kush Seva Trust - Data Security & Integrity',
    titleHi: 'गोपनीयता नीति | लव कुश सेवा ट्रस्ट',
    description:
      'Read the Privacy Policy of Luv Kush Seva Trust. We respect and safeguard the personal data of our donors, volunteers, students, and website visitors.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट गोपनीयता नीति - दानदाताओं, स्वयंसेवकों एवं छात्रों के व्यक्तिगत विवरणों की सुरक्षा तथा गोपनीयता की प्रतिबद्धता।',
    keywords:
      'privacy policy Luv Kush Seva Trust, NGO donor privacy, data protection, luvkushsevatrust.in privacy',
    ogType: 'website',
  },
  terms: {
    path: '/terms',
    title: 'Terms & Conditions | Luv Kush Seva Trust - Rules & Guidelines',
    titleHi: 'नियम एवं शर्तें | लव कुश सेवा ट्रस्ट',
    description:
      'Review official terms of service and donation policies for Luv Kush Seva Trust web portal and community welfare programs.',
    descriptionHi:
      'लव कुश सेवा ट्रस्ट नियम व शर्तें - पोर्टल उपयोग, ऑनलाइन दान एवं कल्याणकारी सेवाओं से संबंधित आधिकारिक दिशा-निर्देश।',
    keywords:
      'terms and conditions, NGO donation policy, Luv Kush Seva Trust terms, legal information',
    ogType: 'website',
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
          'Luv Kush Seva Trust is a government-registered non-profit charitable organisation carrying out social welfare activities, helping underprivileged people with free education, healthcare, and humanitarian care.',
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
          { '@type': 'AdministrativeArea', name: 'Odisha' },
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
