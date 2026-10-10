import React, { useEffect } from 'react';
import { useTrust } from '../context/TrustContext';
import {
  PAGE_SEO_CONFIG,
  SITE_DOMAIN,
  DEFAULT_OG_IMAGE,
  getOrganizationSchema,
  getBreadcrumbSchema,
} from '../config/seoConfig';

function setMetaTag(selector: string, attr: string, value: string) {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    if (selector.startsWith('meta[name=')) {
      const name = selector.match(/meta\[name="?([^"\]]+)"?\]/)?.[1];
      if (name) element.setAttribute('name', name);
    } else if (selector.startsWith('meta[property=')) {
      const prop = selector.match(/meta\[property="?([^"\]]+)"?\]/)?.[1];
      if (prop) element.setAttribute('property', prop);
    }
    document.head.appendChild(element);
  }
  element.setAttribute(attr, value);
}

function setCanonicalLink(url: string) {
  let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLdScript(id: string, data: object) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export const SEOHead: React.FC = () => {
  const { currentPage, language } = useTrust();

  useEffect(() => {
    const seoData = PAGE_SEO_CONFIG[currentPage] || PAGE_SEO_CONFIG.home;
    const isHindi = language === 'hi';

    const title = isHindi ? seoData.titleHi : seoData.title;
    const description = isHindi ? seoData.descriptionHi : seoData.description;
    const canonicalUrl = `${SITE_DOMAIN}${seoData.path === '/' ? '/' : seoData.path}`;

    // 1. Document Title
    document.title = title;

    // 2. Meta Description & Keywords
    setMetaTag('meta[name="description"]', 'content', description);
    setMetaTag('meta[name="keywords"]', 'content', seoData.keywords);

    // 3. Canonical URL
    setCanonicalLink(canonicalUrl);

    // 4. OpenGraph Tags
    setMetaTag('meta[property="og:title"]', 'content', title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    setMetaTag('meta[property="og:type"]', 'content', seoData.ogType || 'website');
    setMetaTag('meta[property="og:image"]', 'content', DEFAULT_OG_IMAGE);
    setMetaTag('meta[property="og:site_name"]', 'content', 'Luv Kush Seva Trust');
    setMetaTag('meta[property="og:locale"]', 'content', isHindi ? 'hi_IN' : 'en_IN');
    setMetaTag('meta[property="og:locale:alternate"]', 'content', isHindi ? 'en_IN' : 'hi_IN');

    // 5. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'content', title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:image"]', 'content', DEFAULT_OG_IMAGE);

    // 6. Structured Data (JSON-LD)
    setJsonLdScript('schema-org-organization', getOrganizationSchema());
    setJsonLdScript('schema-org-breadcrumbs', getBreadcrumbSchema(currentPage));
  }, [currentPage, language]);

  return null;
};
