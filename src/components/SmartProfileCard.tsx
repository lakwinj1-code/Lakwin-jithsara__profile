import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  Images,
  Lock,
  LogOut,
  MessageSquare,
  QrCode,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react';
import { resolveAssetUrl } from '../data/defaults';
import { buildWhatsAppLink } from '../lib/vcardAndImage';
import {
  GalleryItem,
  ProfileData,
  SocialLinkItem,
  SocialPlatform,
  StudioTab,
} from '../types';
import { BrandContactTile } from './PlatformIcon';
import { SafeImage } from './SafeImage';

interface SmartProfileCardProps {
  profile: ProfileData;
  links: SocialLinkItem[];
  gallery: GalleryItem[];
  isOwner: boolean;
  signingIn: boolean;
  unreadCount: number;
  onSaveContact: () => void;
  onOpenShareModal: () => void;
  onOpenMessageModal: () => void;
  onOpenGalleryModal: () => void;
  onOpenStudio: (tab: StudioTab) => void;
  onSelectPhotoFile: (file: File) => void;
  onOwnerSignIn: () => void;
  onOwnerSignOut: () => void;
}

const STAGGER_DELAY_CLASSES = [
  'delay-0',
  'delay-[40ms]',
  'delay-[80ms]',
  'delay-[120ms]',
  'delay-[160ms]',
  'delay-[200ms]',
] as const;

function useInViewport<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin: '0px 0px -12px 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

interface ScrollRevealDivProps {
  className?: string;
  delayClass?: string;
  threshold?: number;
  children: React.ReactNode;
}

const ScrollRevealDiv: React.FC<ScrollRevealDivProps> = ({
  className = '',
  delayClass = 'delay-0',
  threshold = 0.18,
  children,
}) => {
  const { ref, inView } = useInViewport<HTMLDivElement>(threshold);

  return (
    <div
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        inView
          ? `${delayClass} opacity-100 translate-y-0`
          : 'delay-0 opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  );
};

interface ScrollRevealAnchorProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  delayClass?: string;
  children: React.ReactNode;
}

const ScrollRevealAnchor: React.FC<ScrollRevealAnchorProps> = ({
  className = '',
  delayClass = 'delay-0',
  children,
  ...rest
}) => {
  const { ref, inView } = useInViewport<HTMLAnchorElement>(0.14);

  return (
    <a
      ref={ref}
      {...rest}
      className={`${className} transition-[opacity,transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        inView
          ? `${delayClass} opacity-100 translate-y-0`
          : 'delay-0 opacity-0 translate-y-4'
      }`}
    >
      {children}
    </a>
  );
};

const ROTATING_SOCIAL_PHRASES = [
  'Chat with WhatsApp',
  'Follow FB & Instagram',
  'Connect with LinkedIn',
] as const;

const TypewriterHeadline: React.FC<{ primaryHeadline: string }> = ({
  primaryHeadline,
}) => {
  const phrases = React.useMemo(() => {
    const cleanPrimary = primaryHeadline.trim();
    const all = cleanPrimary
      ? [cleanPrimary, ...ROTATING_SOCIAL_PHRASES]
      : [...ROTATING_SOCIAL_PHRASES];
    return Array.from(new Set(all));
  }, [primaryHeadline]);

  const longestPhrase = React.useMemo(
    () =>
      phrases.reduce(
        (longest, current) =>
          current.length > longest.length ? current : longest,
        phrases[0] || ''
      ),
    [phrases]
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const safePhraseIndex = phraseIndex % phrases.length;
  const activePhrase = phrases[safePhraseIndex] || '';
  const chars = React.useMemo(() => Array.from(activePhrase), [activePhrase]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    setPhraseIndex(0);
    setCharIndex(0);
    setIsDeleting(false);
  }, [primaryHeadline]);

  useEffect(() => {
    if (reducedMotion || chars.length === 0) return;

    let delay = 52;
    if (!isDeleting && charIndex >= chars.length) {
      delay = 2100;
    } else if (isDeleting && charIndex === 0) {
      delay = 320;
    } else if (isDeleting) {
      delay = 26;
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < chars.length) {
          setCharIndex((prev) => prev + 1);
        } else {
          setIsDeleting(true);
        }
      } else if (charIndex > 0) {
        setCharIndex((prev) => prev - 1);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [charIndex, isDeleting, chars.length, phrases.length, reducedMotion]);

  if (reducedMotion) {
    return (
      <p className="mt-0.5 text-sm font-medium text-zinc-200">
        {phrases[0] || ''}
      </p>
    );
  }

  const visibleText = chars.slice(0, charIndex).join('');

  return (
    <p
      aria-label={phrases.join(' · ')}
      className="relative mt-0.5 text-sm font-medium text-zinc-200"
    >
      <span aria-hidden="true" className="invisible select-none">
        {longestPhrase}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-start justify-center"
      >
        <span>
          {visibleText}
          <span className="inline-block w-[1.5px] h-[1em] ml-[2px] align-[-0.12em] bg-zinc-200 animate-pulse" />
        </span>
      </span>
    </p>
  );
};

function getActionVerb(platform: SocialPlatform): string {
  switch (platform) {
    case 'whatsapp':
    case 'telegram':
      return 'Chat';
    case 'email':
      return 'Email';
    case 'youtube':
      return 'Watch';
    case 'instagram':
    case 'facebook':
    case 'tiktok':
    case 'x':
      return 'Follow';
    case 'linkedin':
      return 'Connect';
    case 'github':
    case 'website':
    default:
      return 'Open';
  }
}

export const SmartProfileCard: React.FC<SmartProfileCardProps> = ({
  profile,
  links,
  gallery,
  isOwner,
  signingIn,
  unreadCount,
  onSaveContact,
  onOpenShareModal,
  onOpenMessageModal,
  onOpenGalleryModal,
  onOpenStudio,
  onSelectPhotoFile,
  onOwnerSignIn,
  onOwnerSignOut,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const coverSrc = resolveAssetUrl(profile.avatarUrl, 'preset:avatar');
  const visibleLinks = links
    .filter((item) => item.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const publishedPhotos = gallery.filter((g) => g.published);

  const hasWhatsAppInLinks = visibleLinks.some(
    (l) => l.platform === 'whatsapp'
  );
  const directWhatsAppUrl = buildWhatsAppLink(
    profile.whatsappNumber,
    profile.displayName
  );

  const handleCopyText = (e: React.MouseEvent, key: string, value: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1600);
    });
  };

  let contactRowOrder = 0;
  const nextRowDelayClass = () => {
    const idx = Math.min(contactRowOrder, STAGGER_DELAY_CLASSES.length - 1);
    contactRowOrder += 1;
    return STAGGER_DELAY_CLASSES[idx];
  };

  return (
    <div className="w-full max-w-[430px] mx-auto">
      {/* Hidden Direct Photo Input for 1:1 Cover Art */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onSelectPhotoFile(file);
          }
          e.target.value = '';
        }}
      />

      {/* Owner Floating Quick Bar Above Card */}
      {isOwner && (
        <div className="mb-3 px-4 py-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-white/12 flex items-center justify-between gap-2 text-xs text-zinc-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-white whitespace-nowrap">
              Owner Mode
            </span>
            {unreadCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onOpenStudio('inbox')}
                  className="text-blue-400 hover:underline font-medium truncate cursor-pointer"
                >
                  {unreadCount} new message{unreadCount > 1 ? 's' : ''}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenStudio('profile')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-zinc-950 bg-white rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={onOwnerSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Amuse-Inspired Smart Profile Card */}
      <main className="rounded-[26px] overflow-hidden bg-[#121215] border border-white/12 shadow-[0_24px_80px_rgba(0,0,0,0.7)] text-white">
        {/* 1. COVER PHOTO SLOT */}
        <div className="relative w-full aspect-[16/14] bg-[#121215] overflow-hidden">
          <SafeImage
            src={coverSrc}
            alt={profile.displayName}
            fallbackLabel={profile.displayName}
            className="w-full h-full object-cover object-[50%_60%]"
          />

          {/* Progressive Optical Blur + Multi-Stop Eased Melt into Bio Header */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-44 backdrop-blur-md [-webkit-mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.85)_30%,rgba(0,0,0,0.45)_60%,rgba(0,0,0,0.12)_84%,transparent_100%)] [mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.85)_30%,rgba(0,0,0,0.45)_60%,rgba(0,0,0,0.12)_84%,transparent_100%)] pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-28 backdrop-blur-2xl [-webkit-mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.75)_42%,transparent_100%)] [mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.75)_42%,transparent_100%)] pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(to_top,#121215_0%,#121215_12%,rgba(18,18,21,0.94)_25%,rgba(18,18,21,0.78)_40%,rgba(18,18,21,0.52)_57%,rgba(18,18,21,0.25)_75%,rgba(18,18,21,0.07)_90%,transparent_100%)] pointer-events-none"
          />

          {/* Top-Right QR & Share Trigger */}
          <button
            type="button"
            onClick={onOpenShareModal}
            aria-label="Show QR Code and Share Link"
            title="QR Code & Share"
            className="absolute top-3.5 right-3.5 min-w-[44px] min-h-[44px] rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-white hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Direct Photo Change Trigger for Owner (Top-Left to stay clear of raised bio header) */}
          {isOwner && (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="absolute top-3.5 left-3.5 inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-xs font-semibold text-white hover:bg-black transition-colors cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Change Photo</span>
            </button>
          )}
        </div>

        {/* 2. COMPACT IDENTITY & BIO HEADER (Smoothly Melted Over Progressive Blur) */}
        <ScrollRevealDiv
          threshold={0.12}
          className="relative z-10 -mt-14 px-6 pt-0 pb-4 text-center"
        >
          <h1 className="font-display text-2xl sm:text-[1.65rem] font-bold tracking-tight text-white text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            {profile.displayName}
          </h1>

          <TypewriterHeadline primaryHeadline={profile.headline} />

          {(profile.location.trim() || profile.availabilityText.trim()) && (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-400">
              {profile.location.trim() && <span>{profile.location.trim()}</span>}
              {profile.location.trim() && profile.availabilityText.trim() && (
                <span aria-hidden="true">·</span>
              )}
              {profile.availabilityText.trim() && (
                <span>{profile.availabilityText.trim()}</span>
              )}
            </div>
          )}

          {profile.bio.trim() && (
            <p className="mt-2 text-xs sm:text-[13px] text-zinc-400 leading-relaxed whitespace-pre-line">
              {profile.bio.trim()}
            </p>
          )}

          {/* Primary Action Bar */}
          <ScrollRevealDiv
            threshold={0.15}
            delayClass="delay-[60ms]"
            className={`mt-3.5 grid gap-2.5 ${
              publishedPhotos.length > 0 ? 'grid-cols-3' : 'grid-cols-2'
            }`}
          >
            <button
              type="button"
              onClick={onSaveContact}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Save Contact</span>
            </button>

            <button
              type="button"
              onClick={onOpenMessageModal}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-white/10 border border-white/12 rounded-xl hover:bg-white/16 transition-colors cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Message</span>
            </button>

            {publishedPhotos.length > 0 && (
              <button
                type="button"
                onClick={onOpenGalleryModal}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-white/10 border border-white/12 rounded-xl hover:bg-white/16 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Images className="w-3.5 h-3.5 shrink-0" />
                <span>Photos</span>
              </button>
            )}
          </ScrollRevealDiv>
        </ScrollRevealDiv>

        {/* 3. AMUSE-STYLE CONTACT DETAILS & SOCIAL MEDIA ROWS */}
        <ScrollRevealDiv
          threshold={0.05}
          className="px-3 pb-3 border-t border-white/8 pt-2.5 space-y-1"
        >
          {/* Direct WhatsApp Row (if configured in profile and not duplicated in social links) */}
          {!hasWhatsAppInLinks && directWhatsAppUrl && (
            <ScrollRevealAnchor
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              delayClass={nextRowDelayClass()}
              className="group flex items-center justify-between gap-3 px-3 py-2.5 min-h-[60px] rounded-2xl hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <BrandContactTile kind="whatsapp" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    WhatsApp
                  </p>
                  <p className="text-xs font-mono tabular-nums text-zinc-400 truncate">
                    {profile.whatsappNumber.trim()}
                  </p>
                </div>
              </div>

              <span className="px-3.5 py-1.5 rounded-lg border border-white/15 bg-white/[0.06] group-hover:bg-white group-hover:text-zinc-950 text-xs font-semibold text-white transition-colors duration-150 whitespace-nowrap shrink-0">
                Chat
              </span>
            </ScrollRevealAnchor>
          )}

          {/* Direct Email Row */}
          {profile.contactEmail.trim() && (
            <ScrollRevealAnchor
              href={`mailto:${profile.contactEmail.trim()}`}
              delayClass={nextRowDelayClass()}
              className="group flex items-center justify-between gap-3 px-3 py-2.5 min-h-[60px] rounded-2xl hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <BrandContactTile
                  kind="email"
                  hint={profile.contactEmail.trim()}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    Email
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {profile.contactEmail.trim()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) =>
                    handleCopyText(e, 'email', profile.contactEmail.trim())
                  }
                  aria-label="Copy email"
                  title="Copy email"
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {copiedKey === 'email' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="px-3.5 py-1.5 rounded-lg border border-white/15 bg-white/[0.06] group-hover:bg-white group-hover:text-zinc-950 text-xs font-semibold text-white transition-colors duration-150 whitespace-nowrap">
                  Email
                </span>
              </div>
            </ScrollRevealAnchor>
          )}

          {/* Social Media & Channel Rows */}
          {visibleLinks.map((item) => {
            const resolvedHref =
              item.platform === 'whatsapp' &&
              directWhatsAppUrl &&
              (item.url.includes('94770000000') || item.id === 'default-whatsapp')
                ? directWhatsAppUrl
                : item.url;
            const resolvedHandle =
              item.platform === 'whatsapp' &&
              profile.whatsappNumber.trim() &&
              profile.whatsappNumber.trim() !== '+94770000000' &&
              (item.handle.trim() === 'Chat directly on WhatsApp' ||
                item.handle.includes('94770000000'))
                ? profile.whatsappNumber.trim()
                : item.handle.trim();

            const isExternal =
              !resolvedHref.startsWith('mailto:') &&
              !resolvedHref.startsWith('tel:');
            const actionVerb = getActionVerb(item.platform);

            return (
              <ScrollRevealAnchor
                key={item.id}
                href={resolvedHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                delayClass={nextRowDelayClass()}
                className="group flex items-center justify-between gap-3 px-3 py-2.5 min-h-[60px] rounded-2xl hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <BrandContactTile
                    kind={item.platform}
                    hint={`${resolvedHref} ${resolvedHandle}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {item.label}
                    </p>
                    {resolvedHandle && (
                      <p className="text-xs text-zinc-400 truncate">
                        {resolvedHandle}
                      </p>
                    )}
                  </div>
                </div>

                <span className="px-3.5 py-1.5 rounded-lg border border-white/15 bg-white/[0.06] group-hover:bg-white group-hover:text-zinc-950 text-xs font-semibold text-white transition-colors duration-150 whitespace-nowrap shrink-0">
                  {actionVerb}
                </span>
              </ScrollRevealAnchor>
            );
          })}
        </ScrollRevealDiv>

        {/* 4. CARD FOOTER WITH EASY PHOTO / PROFILE EDIT ACCESS */}
        <footer className="px-5 py-3.5 border-t border-white/8 bg-black/30 flex items-center justify-between gap-3 text-[11px] text-zinc-400">
          <button
            type="button"
            onClick={onOpenShareModal}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Share &amp; QR Card
          </button>

          {isOwner ? (
            <button
              type="button"
              onClick={() => onOpenStudio('profile')}
              className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>Edit Profile &amp; Links</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOwnerSignIn}
              disabled={signingIn}
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3 h-3 shrink-0" />
              <span>
                {signingIn ? 'Signing in...' : 'Owner Login (Edit Photo & Info)'}
              </span>
            </button>
          )}
        </footer>
      </main>
    </div>
  );
};
