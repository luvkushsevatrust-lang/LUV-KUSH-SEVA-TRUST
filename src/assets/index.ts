/**
 * Centralized Asset Management for Luv Kush Seva Trust
 *
 * This module ensures that all local image assets are:
 * 1. Processed, hashed, and bundled by Vite for production (Vercel deployment)
 * 2. Mapped seamlessly so legacy string paths (e.g. '/src/assets/images/...')
 *    resolve to the bundled Vite URLs without 404 errors.
 */

import trustEmblemLogo from './images/trust_emblem_logo_1790500141646.jpg';
import heroTrustSeva from './images/hero_trust_seva_1790500083256.jpg';
import orphanageCare from './images/orphanage_care_1790500099587.jpg';
import oldAgeCare from './images/old_age_care_1790500114183.jpg';
import freeEducation from './images/free_education_1791140935609.jpg';
import freeEducationAlt from './images/free_education_1791140818155.jpg';
import medicalCamp from './images/medical_camp_1790500125790.jpg';
import communityWelfare from './images/community_welfare_1791140948090.jpg';
import communityWelfareAlt from './images/community_welfare_1791140830800.jpg';
import chairpersonSatyendraKumar from './images/chairperson_satyendra_kumar_1791278682704.jpg';
import officialTrustLogo from './images/official_trust_logo_1791611180186.jpg';
import trustLogoClear from './images/trust_logo_clear.png';
import trustEmblemClear from './images/trust_emblem_clear.png';
import trustLogoRound from './images/trust_logo_round.png';

export const TRUST_ASSETS = {
  trustLogoRound,
  trustLogoClear,
  trustEmblemClear,
  trustEmblemLogo,
  officialTrustLogo,
  heroTrustSeva,
  orphanageCare,
  oldAgeCare,
  freeEducation,
  freeEducationAlt,
  medicalCamp,
  communityWelfare,
  communityWelfareAlt,
  chairpersonSatyendraKumar,
} as const;

export {
  trustLogoRound,
  trustLogoClear,
  trustEmblemClear,
  trustEmblemLogo,
  officialTrustLogo,
  heroTrustSeva,
  orphanageCare,
  oldAgeCare,
  freeEducation,
  freeEducationAlt,
  medicalCamp,
  communityWelfare,
  communityWelfareAlt,
  chairpersonSatyendraKumar,
};

// Aliases matching domain entities - high clarity round logo default
export const TRUST_LOGO_ROUND = trustLogoRound;
export const TRUST_LOGO_CLEAR = trustLogoRound;
export const TRUST_EMBLEM_CLEAR = trustLogoRound;
export const TRUST_EMBLEM_LOGO = trustLogoRound;
export const OFFICIAL_TRUST_LOGO = trustLogoRound;
export const HERO_TRUST_SEVA = heroTrustSeva;
export const ORPHANAGE_CARE = orphanageCare;
export const OLD_AGE_CARE = oldAgeCare;
export const FREE_EDUCATION = freeEducation;
export const MEDICAL_CAMP = medicalCamp;
export const COMMUNITY_WELFARE = communityWelfare;
export const CHAIRPERSON_PHOTO = chairpersonSatyendraKumar;
export const CHAIRPERSON_SATYENDRA_KUMAR = chairpersonSatyendraKumar;

/**
 * Mapping table from any raw filename or path to its bundled Vite asset URL
 */
const ASSET_PATH_LOOKUP: Record<string, string> = {
  // Filenames alone
  'trust_emblem_logo_1790500141646.jpg': trustEmblemLogo,
  'hero_trust_seva_1790500083256.jpg': heroTrustSeva,
  'orphanage_care_1790500099587.jpg': orphanageCare,
  'old_age_care_1790500114183.jpg': oldAgeCare,
  'free_education_1791140935609.jpg': freeEducation,
  'free_education_1791140818155.jpg': freeEducationAlt,
  'medical_camp_1790500125790.jpg': medicalCamp,
  'community_welfare_1791140948090.jpg': communityWelfare,
  'community_welfare_1791140830800.jpg': communityWelfareAlt,
  'chairperson_satyendra_kumar_1791278682704.jpg': chairpersonSatyendraKumar,
  'chairperson.jpg': chairpersonSatyendraKumar,
  'satyendra_kumar.jpg': chairpersonSatyendraKumar,
  'trust_logo_round.png': trustLogoRound,
  '/trust_logo_round.png': trustLogoRound,
  'trust_logo_clear.png': trustLogoClear,
  'trust_emblem_clear.png': trustEmblemClear,
  '/trust_logo_clear.png': trustLogoClear,
  '/trust_emblem_clear.png': trustEmblemClear,
  'official_trust_logo_1791611180186.jpg': officialTrustLogo,
  'official_trust_logo.jpg': officialTrustLogo,
  'trust_logo.jpg': officialTrustLogo,
  'logo.jpg': officialTrustLogo,

  // Root filenames
  '/trust_emblem_logo_1790500141646.jpg': trustEmblemLogo,
  '/hero_trust_seva_1790500083256.jpg': heroTrustSeva,
  '/orphanage_care_1790500099587.jpg': orphanageCare,
  '/old_age_care_1790500114183.jpg': oldAgeCare,
  '/free_education_1791140935609.jpg': freeEducation,
  '/free_education_1791140818155.jpg': freeEducationAlt,
  '/medical_camp_1790500125790.jpg': medicalCamp,
  '/community_welfare_1791140948090.jpg': communityWelfare,
  '/community_welfare_1791140830800.jpg': communityWelfareAlt,
  '/chairperson_satyendra_kumar_1791278682704.jpg': chairpersonSatyendraKumar,
  '/chairperson.jpg': chairpersonSatyendraKumar,
  '/satyendra_kumar.jpg': chairpersonSatyendraKumar,

  // Full /src/assets/images/ paths
  '/src/assets/images/trust_emblem_logo_1790500141646.jpg': trustEmblemLogo,
  '/src/assets/images/hero_trust_seva_1790500083256.jpg': heroTrustSeva,
  '/src/assets/images/orphanage_care_1790500099587.jpg': orphanageCare,
  '/src/assets/images/old_age_care_1790500114183.jpg': oldAgeCare,
  '/src/assets/images/free_education_1791140935609.jpg': freeEducation,
  '/src/assets/images/free_education_1791140818155.jpg': freeEducationAlt,
  '/src/assets/images/medical_camp_1790500125790.jpg': medicalCamp,
  '/src/assets/images/community_welfare_1791140948090.jpg': communityWelfare,
  '/src/assets/images/community_welfare_1791140830800.jpg': communityWelfareAlt,
  '/src/assets/images/chairperson_satyendra_kumar_1791278682704.jpg': chairpersonSatyendraKumar,

  // Relative src/assets/images/ paths
  'src/assets/images/trust_emblem_logo_1790500141646.jpg': trustEmblemLogo,
  'src/assets/images/hero_trust_seva_1790500083256.jpg': heroTrustSeva,
  'src/assets/images/orphanage_care_1790500099587.jpg': orphanageCare,
  'src/assets/images/old_age_care_1790500114183.jpg': oldAgeCare,
  'src/assets/images/free_education_1791140935609.jpg': freeEducation,
  'src/assets/images/free_education_1791140818155.jpg': freeEducationAlt,
  'src/assets/images/medical_camp_1790500125790.jpg': medicalCamp,
  'src/assets/images/community_welfare_1791140948090.jpg': communityWelfare,
  'src/assets/images/community_welfare_1791140830800.jpg': communityWelfareAlt,
  'src/assets/images/chairperson_satyendra_kumar_1791278682704.jpg': chairpersonSatyendraKumar,

  // Root /assets/images/ paths
  '/assets/images/trust_emblem_logo_1790500141646.jpg': trustEmblemLogo,
  '/assets/images/hero_trust_seva_1790500083256.jpg': heroTrustSeva,
  '/assets/images/orphanage_care_1790500099587.jpg': orphanageCare,
  '/assets/images/old_age_care_1790500114183.jpg': oldAgeCare,
  '/assets/images/free_education_1791140935609.jpg': freeEducation,
  '/assets/images/free_education_1791140818155.jpg': freeEducationAlt,
  '/assets/images/medical_camp_1790500125790.jpg': medicalCamp,
  '/assets/images/community_welfare_1791140948090.jpg': communityWelfare,
  '/assets/images/community_welfare_1791140830800.jpg': communityWelfareAlt,
  '/assets/images/chairperson_satyendra_kumar_1791278682704.jpg': chairpersonSatyendraKumar,

  // Relative assets/images/ paths
  'assets/images/trust_emblem_logo_1790500141646.jpg': trustEmblemLogo,
  'assets/images/hero_trust_seva_1790500083256.jpg': heroTrustSeva,
  'assets/images/orphanage_care_1790500099587.jpg': orphanageCare,
  'assets/images/old_age_care_1790500114183.jpg': oldAgeCare,
  'assets/images/free_education_1791140935609.jpg': freeEducation,
  'assets/images/free_education_1791140818155.jpg': freeEducationAlt,
  'assets/images/medical_camp_1790500125790.jpg': medicalCamp,
  'assets/images/community_welfare_1791140948090.jpg': communityWelfare,
  'assets/images/community_welfare_1791140830800.jpg': communityWelfareAlt,
  'assets/images/chairperson_satyendra_kumar_1791278682704.jpg': chairpersonSatyendraKumar,

  // Root /images/ paths
  '/images/trust_emblem_logo_1790500141646.jpg': trustEmblemLogo,
  '/images/hero_trust_seva_1790500083256.jpg': heroTrustSeva,
  '/images/orphanage_care_1790500099587.jpg': orphanageCare,
  '/images/old_age_care_1790500114183.jpg': oldAgeCare,
  '/images/free_education_1791140935609.jpg': freeEducation,
  '/images/free_education_1791140818155.jpg': freeEducationAlt,
  '/images/medical_camp_1790500125790.jpg': medicalCamp,
  '/images/community_welfare_1791140948090.jpg': communityWelfare,
  '/images/community_welfare_1791140830800.jpg': communityWelfareAlt,
  '/images/chairperson_satyendra_kumar_1791278682704.jpg': chairpersonSatyendraKumar,

  // Relative images/ paths
  'images/trust_emblem_logo_1790500141646.jpg': trustEmblemLogo,
  'images/hero_trust_seva_1790500083256.jpg': heroTrustSeva,
  'images/orphanage_care_1790500099587.jpg': orphanageCare,
  'images/old_age_care_1790500114183.jpg': oldAgeCare,
  'images/free_education_1791140935609.jpg': freeEducation,
  'images/free_education_1791140818155.jpg': freeEducationAlt,
  'images/medical_camp_1790500125790.jpg': medicalCamp,
  'images/community_welfare_1791140948090.jpg': communityWelfare,
  'images/community_welfare_1791140830800.jpg': communityWelfareAlt,
  'images/chairperson_satyendra_kumar_1791278682704.jpg': chairpersonSatyendraKumar,

  // Legacy fallback alias
  '/trust_official_emblem.png': trustEmblemLogo,
  'trust_official_emblem.png': trustEmblemLogo,
};

/**
 * Resolves any raw path, legacy URL, or filename to a production-safe Vite bundled asset URL.
 */
export function resolveAssetUrl(rawPath: string | undefined | null): string {
  if (!rawPath) return trustEmblemLogo;

  // Already a data URL or blob URL
  if (rawPath.startsWith('data:') || rawPath.startsWith('blob:')) {
    return rawPath;
  }

  // Exact lookup in registered assets
  if (ASSET_PATH_LOOKUP[rawPath]) {
    return ASSET_PATH_LOOKUP[rawPath];
  }

  // Strip query string and fragment
  const clean = rawPath.split('?')[0].split('#')[0];
  if (ASSET_PATH_LOOKUP[clean]) {
    return ASSET_PATH_LOOKUP[clean];
  }

  // Strip leading dot and slash
  const trimmed = clean.replace(/^\.?\//, '');
  if (ASSET_PATH_LOOKUP[trimmed]) {
    return ASSET_PATH_LOOKUP[trimmed];
  }
  if (ASSET_PATH_LOOKUP['/' + trimmed]) {
    return ASSET_PATH_LOOKUP['/' + trimmed];
  }

  // Check by filename alone
  const filename = clean.split('/').pop() || '';
  if (filename && ASSET_PATH_LOOKUP[filename]) {
    return ASSET_PATH_LOOKUP[filename];
  }

  // If already an external link, verify if it references one of our known filenames
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    const externalFile = rawPath.split('/').pop()?.split('?')[0]?.split('#')[0] || '';
    if (externalFile && ASSET_PATH_LOOKUP[externalFile]) {
      return ASSET_PATH_LOOKUP[externalFile];
    }
    return rawPath;
  }

  // Fallback to rawPath
  return rawPath;
}
