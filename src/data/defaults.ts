import defaultHeroImg from '../assets/images/hero_creative_studio_1793632020553.jpg';
import galleryBrandImg from '../assets/images/gallery_brand_identity_1793632021487.jpg';
import galleryArchImg from '../assets/images/gallery_architectural_photo_1793632022401.jpg';
import galleryCoastImg from '../assets/images/gallery_coastal_horizon_1793632023735.jpg';
import { GalleryItem, ProfileData, SocialLinkItem } from '../types';

export const USER_PROFILE_PHOTO = '/assets/aistudio/edit__980b997a.jpg';

export const PRESET_ASSETS: Record<string, string> = {
  'preset:avatar': USER_PROFILE_PHOTO,
  'preset:hero': defaultHeroImg,
  'preset:brand': galleryBrandImg,
  'preset:arch': galleryArchImg,
  'preset:coast': galleryCoastImg,
};

export const PRESET_GALLERY_CHOICES = [
  { key: 'preset:brand', label: 'Studio Monograph & Print', preview: galleryBrandImg },
  { key: 'preset:arch', label: 'Architectural Light Study', preview: galleryArchImg },
  { key: 'preset:coast', label: 'Southern Coast Horizon', preview: galleryCoastImg },
  { key: 'preset:hero', label: 'Creative Desk & Camera', preview: defaultHeroImg },
];

export function resolveAssetUrl(rawUrl: string, fallbackKey: keyof typeof PRESET_ASSETS = 'preset:hero'): string {
  if (!rawUrl || !rawUrl.trim()) {
    return PRESET_ASSETS[fallbackKey] || defaultHeroImg;
  }
  const trimmed = rawUrl.trim();
  if (PRESET_ASSETS[trimmed]) {
    return PRESET_ASSETS[trimmed];
  }
  return trimmed;
}

export const DEFAULT_PROFILE: ProfileData = {
  displayName: 'Lakwin Jithsara',
  headline: 'Digital Creator & Technologist',
  bio: 'Connect with me directly across phone, WhatsApp, email, and social media.',
  location: 'Sri Lanka',
  availabilityText: '',
  contactEmail: 'lakwinj1@gmail.com',
  contactPhone: '+94 77 000 0000',
  whatsappNumber: '+94770000000',
  websiteUrl: '',
  avatarUrl: USER_PROFILE_PHOTO,
  heroImageUrl: 'preset:hero',
  isPublished: true,
  ownerUid: 'seed',
};

export const DEFAULT_SOCIAL_LINKS: SocialLinkItem[] = [
  {
    id: 'default-whatsapp',
    platform: 'whatsapp',
    label: 'WhatsApp Direct',
    handle: 'Chat directly on WhatsApp',
    url: 'https://wa.me/94770000000',
    sortOrder: 1,
    visible: true,
    ownerUid: 'seed',
  },
  {
    id: 'default-instagram',
    platform: 'instagram',
    label: 'Instagram',
    handle: '@lakwin',
    url: 'https://instagram.com',
    sortOrder: 2,
    visible: true,
    ownerUid: 'seed',
  },
  {
    id: 'default-linkedin',
    platform: 'linkedin',
    label: 'LinkedIn',
    handle: 'Professional profile & network',
    url: 'https://linkedin.com',
    sortOrder: 3,
    visible: true,
    ownerUid: 'seed',
  },
  {
    id: 'default-facebook',
    platform: 'facebook',
    label: 'Facebook',
    handle: 'Updates & community',
    url: 'https://facebook.com',
    sortOrder: 4,
    visible: true,
    ownerUid: 'seed',
  },
  {
    id: 'default-youtube',
    platform: 'youtube',
    label: 'YouTube',
    handle: 'Videos & creative reels',
    url: 'https://youtube.com',
    sortOrder: 5,
    visible: true,
    ownerUid: 'seed',
  },
  {
    id: 'default-github',
    platform: 'github',
    label: 'GitHub',
    handle: 'Code & open-source projects',
    url: 'https://github.com',
    sortOrder: 6,
    visible: true,
    ownerUid: 'seed',
  },
];

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'default-gallery-1',
    title: 'Essential Forms — Editorial Identity System',
    category: 'Design',
    year: '2026',
    description: 'Minimalist print monograph, tactile paper architecture, and typographic identity exploration crafted with natural studio lighting.',
    imageUrl: 'preset:brand',
    externalUrl: '',
    featured: true,
    published: true,
    sortOrder: 1,
    ownerUid: 'seed',
  },
  {
    id: 'default-gallery-2',
    title: 'Concrete & Golden Hour Geometry',
    category: 'Photography',
    year: '2026',
    description: 'Architectural light and shadow study capturing late-afternoon sun across brutalist concrete and glass.',
    imageUrl: 'preset:arch',
    externalUrl: '',
    featured: false,
    published: true,
    sortOrder: 2,
    ownerUid: 'seed',
  },
  {
    id: 'default-gallery-3',
    title: 'Southern Coastline at Dusk',
    category: 'Photography',
    year: '2025',
    description: 'Calm twilight tide along the Sri Lankan southern coast reflecting cobalt skies and warm horizon light.',
    imageUrl: 'preset:coast',
    externalUrl: '',
    featured: false,
    published: true,
    sortOrder: 3,
    ownerUid: 'seed',
  },
  {
    id: 'default-gallery-4',
    title: 'Minimalist Creative Workspace Setup',
    category: 'Projects',
    year: '2026',
    description: 'Everyday tools, analog sketchbook, rangefinder camera, and digital workflow setup.',
    imageUrl: 'preset:hero',
    externalUrl: '',
    featured: false,
    published: true,
    sortOrder: 4,
    ownerUid: 'seed',
  },
];
