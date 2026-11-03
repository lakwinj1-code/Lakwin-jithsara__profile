import { Timestamp } from 'firebase/firestore';

export type SocialPlatform =
  | 'whatsapp'
  | 'instagram'
  | 'linkedin'
  | 'facebook'
  | 'youtube'
  | 'x'
  | 'github'
  | 'tiktok'
  | 'telegram'
  | 'email'
  | 'website'
  | 'other';

export interface ProfileData {
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  availabilityText: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  websiteUrl: string;
  avatarUrl: string;
  heroImageUrl: string;
  isPublished: boolean;
  ownerUid: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform;
  label: string;
  handle: string;
  url: string;
  sortOrder: number;
  visible: boolean;
  ownerUid: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  ownerUid: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type MessageStatus = 'unread' | 'read' | 'archived';

export interface ContactMessageItem {
  id: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  message: string;
  status: MessageStatus;
  targetProfileId: 'main';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type StudioTab = 'profile' | 'links' | 'gallery' | 'inbox';
