import { BgTheme } from '../types';

export interface BgThemeConfig {
  id: BgTheme;
  nameHi: string;
  nameEn: string;
  descHi: string;
  descEn: string;
  bgHex: string;
  subtleHex: string;
  previewColor: string;
  textColor: string;
  borderAccent: string;
}

export const BG_THEMES: Record<BgTheme, BgThemeConfig> = {
  sandalwood: {
    id: 'sandalwood',
    nameHi: 'चंदन क्रीम (डिफ़ॉल्ट)',
    nameEn: 'Sandalwood Cream (Default)',
    descHi: 'पवित्र, सौम्य और शांत चंदन आभा',
    descEn: 'Sacred, serene & warm sandalwood tint',
    bgHex: '#F5EFE4',
    subtleHex: '#EAE1D2',
    previewColor: '#DECDB5',
    textColor: 'text-stone-900',
    borderAccent: 'border-amber-300',
  },
  amber: {
    id: 'amber',
    nameHi: 'सात्विक केसरिया',
    nameEn: 'Saffron Mist',
    descHi: 'ऊर्जावान और मंगलकारी केसरिया रंग',
    descEn: 'Auspicious and energizing saffron tint',
    bgHex: '#FDF2E4',
    subtleHex: '#F6E4CD',
    previewColor: '#F7CCA0',
    textColor: 'text-stone-900',
    borderAccent: 'border-orange-300',
  },
  sand: {
    id: 'sand',
    nameHi: 'धूलि बादामी',
    nameEn: 'Warm Sand',
    descHi: 'सौम्य प्राकृतिक बादामी रंग',
    descEn: 'Natural, earthy warm beige tone',
    bgHex: '#EFE8DC',
    subtleHex: '#DFD5C4',
    previewColor: '#CDBC9F',
    textColor: 'text-stone-900',
    borderAccent: 'border-stone-400',
  },
  sage: {
    id: 'sage',
    nameHi: 'सौम्य हरित',
    nameEn: 'Serene Sage',
    descHi: 'आँखों को शीतलता देने वाला हल्का हरा',
    descEn: 'Cooling, herbal light sage green',
    bgHex: '#EEF4ED',
    subtleHex: '#DCE8DC',
    previewColor: '#BED4BF',
    textColor: 'text-stone-900',
    borderAccent: 'border-emerald-300',
  },
  sky: {
    id: 'sky',
    nameHi: 'शांत आसमानी',
    nameEn: 'Peaceful Sky',
    descHi: 'निर्मल और शांत हल्का नीला',
    descEn: 'Clear, peaceful divine light sky blue',
    bgHex: '#EDF3FA',
    subtleHex: '#D9E6F5',
    previewColor: '#B6D1EF',
    textColor: 'text-stone-900',
    borderAccent: 'border-blue-300',
  },
  white: {
    id: 'white',
    nameHi: 'क्लासिक व्हाइट',
    nameEn: 'Classic White',
    descHi: 'सामान्य सादा सफेद रंग',
    descEn: 'Standard plain white background',
    bgHex: '#FAFAFA',
    subtleHex: '#E5E7EB',
    previewColor: '#FFFFFF',
    textColor: 'text-slate-900',
    borderAccent: 'border-slate-300',
  },
};
