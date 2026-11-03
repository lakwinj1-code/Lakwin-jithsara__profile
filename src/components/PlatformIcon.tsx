import React from 'react';
import {
  Globe,
  Link2,
  Mail,
  MessageCircle,
  Send,
} from 'lucide-react';
import { SocialPlatform } from '../types';

export const SOCIAL_PLATFORM_OPTIONS: {
  value: SocialPlatform;
  label: string;
  placeholderUrl: string;
  placeholderHandle: string;
}[] = [
  {
    value: 'whatsapp',
    label: 'WhatsApp',
    placeholderUrl: 'https://wa.me/94770000000',
    placeholderHandle: '+94 77 000 0000',
  },
  {
    value: 'instagram',
    label: 'Instagram',
    placeholderUrl: 'https://instagram.com/username',
    placeholderHandle: '@username',
  },
  {
    value: 'linkedin',
    label: 'LinkedIn',
    placeholderUrl: 'https://linkedin.com/in/username',
    placeholderHandle: 'in/username',
  },
  {
    value: 'facebook',
    label: 'Facebook',
    placeholderUrl: 'https://facebook.com/username',
    placeholderHandle: 'facebook.com/username',
  },
  {
    value: 'youtube',
    label: 'YouTube',
    placeholderUrl: 'https://youtube.com/@channel',
    placeholderHandle: '@channel',
  },
  {
    value: 'x',
    label: 'X (Twitter)',
    placeholderUrl: 'https://x.com/username',
    placeholderHandle: '@username',
  },
  {
    value: 'github',
    label: 'GitHub',
    placeholderUrl: 'https://github.com/username',
    placeholderHandle: 'github.com/username',
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    placeholderUrl: 'https://tiktok.com/@username',
    placeholderHandle: '@username',
  },
  {
    value: 'telegram',
    label: 'Telegram',
    placeholderUrl: 'https://t.me/username',
    placeholderHandle: '@username',
  },
  {
    value: 'email',
    label: 'Email',
    placeholderUrl: 'mailto:hello@example.com',
    placeholderHandle: 'hello@example.com',
  },
  {
    value: 'website',
    label: 'Website',
    placeholderUrl: 'https://example.com',
    placeholderHandle: 'example.com',
  },
  {
    value: 'other',
    label: 'Custom Link',
    placeholderUrl: 'https://example.com/resource',
    placeholderHandle: 'External link',
  },
];

export const PlatformIcon: React.FC<{
  platform: SocialPlatform;
  className?: string;
}> = ({ platform, className = 'w-5 h-5' }) => {
  switch (platform) {
    case 'whatsapp':
      return <MessageCircle className={className} />;
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      );
    case 'telegram':
      return <Send className={className} />;
    case 'email':
      return <Mail className={className} />;
    case 'website':
      return <Globe className={className} />;
    default:
      return <Link2 className={className} />;
  }
};

export type ContactTileKind = SocialPlatform | 'phone';

export const BrandContactTile: React.FC<{
  kind: ContactTileKind;
  hint?: string;
}> = ({ kind, hint = '' }) => {
  const tileBase =
    'w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/15 transition-transform duration-150 group-hover:scale-105';

  switch (kind) {
    case 'phone':
      return (
        <div
          className={`${tileBase} bg-gradient-to-b from-[#5EE873] to-[#24BE41] text-white`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
            aria-hidden="true"
          >
            <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z" />
          </svg>
        </div>
      );

    case 'whatsapp':
      return (
        <div
          className={`${tileBase} bg-gradient-to-b from-[#4EE869] via-[#25D366] to-[#17A74A] text-white`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-[22px] h-[22px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.16)]"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
        </div>
      );

    case 'instagram':
      return (
        <div
          className={`${tileBase} bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_6%,#fd5949_45%,#d6249f_62%,#285AEB_92%)] text-white`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-[21px] h-[21px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
            aria-hidden="true"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      );

    case 'linkedin':
      return (
        <div className={`${tileBase} bg-[#0A66C2] text-white`}>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
          </svg>
        </div>
      );

    case 'facebook':
      return (
        <div className={`${tileBase} bg-[#1877F2] text-white`}>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-[22px] h-[22px]"
            aria-hidden="true"
          >
            <path d="M15.12 5.32H17V2.14A26.11 26.11 0 0 0 14.26 2c-2.72 0-4.58 1.66-4.58 4.7v2.62H6.61v3.56h3.07V22h3.68v-9.12h3.06l.46-3.56h-3.52V6.65c0-1.05.29-1.73 1.76-1.73Z" />
          </svg>
        </div>
      );

    case 'youtube':
      return (
        <div className={`${tileBase} bg-white`}>
          <svg
            viewBox="0 0 24 24"
            className="w-[23px] h-[23px]"
            aria-hidden="true"
          >
            <path
              fill="#FF0000"
              d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
            />
            <path
              fill="#FFFFFF"
              d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"
            />
          </svg>
        </div>
      );

    case 'x':
      return (
        <div
          className={`${tileBase} bg-[#09090B] text-white ring-white/25`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-[18px] h-[18px]"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );

    case 'github':
      return (
        <div
          className={`${tileBase} bg-gradient-to-b from-[#2B3137] to-[#161B22] text-white ring-white/22`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-[21px] h-[21px]"
            aria-hidden="true"
          >
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </div>
      );

    case 'tiktok':
      return (
        <div
          className={`${tileBase} bg-[#050505] ring-white/25`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path
              fill="#25F4EE"
              d="M18.9 7.4a4.6 4.6 0 0 1-3.3-3.4V3.5h-2.9v11.3a2.5 2.5 0 1 1-2-2.4V9.4a5.4 5.4 0 1 0 4.9 5.4V9.3a7.4 7.4 0 0 0 4.2 1.3V7.8c-.3 0-.6-.2-.9-.4Z"
              transform="translate(-0.75 -0.45)"
            />
            <path
              fill="#FE2C55"
              d="M18.9 7.4a4.6 4.6 0 0 1-3.3-3.4V3.5h-2.9v11.3a2.5 2.5 0 1 1-2-2.4V9.4a5.4 5.4 0 1 0 4.9 5.4V9.3a7.4 7.4 0 0 0 4.2 1.3V7.8c-.3 0-.6-.2-.9-.4Z"
              transform="translate(0.75 0.45)"
            />
            <path
              fill="#FFFFFF"
              d="M18.9 7.4a4.6 4.6 0 0 1-3.3-3.4V3.5h-2.9v11.3a2.5 2.5 0 1 1-2-2.4V9.4a5.4 5.4 0 1 0 4.9 5.4V9.3a7.4 7.4 0 0 0 4.2 1.3V7.8c-.3 0-.6-.2-.9-.4Z"
            />
          </svg>
        </div>
      );

    case 'telegram':
      return (
        <div
          className={`${tileBase} bg-gradient-to-b from-[#37BBFE] to-[#007DBB] text-white`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M19.2 4.4 2.9 10.7c-1.1.4-1.1 1.1-.2 1.3l4.1 1.3 1.6 4.8c.2.5.1.7.6.7.4 0 .6-.2.8-.4l2-2 4.2 3.1c.8.4 1.3.2 1.5-.7L20.3 5.6c.3-1.1-.4-1.6-1.1-1.2zM8.3 12.8l9.2-5.8c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.2-1.8-4.5z" />
          </svg>
        </div>
      );

    case 'email': {
      const isGmail = hint.toLowerCase().includes('gmail.com');
      if (isGmail) {
        return (
          <div className={`${tileBase} bg-white`}>
            <svg
              viewBox="52 42 88 66"
              className="w-[22px] h-[22px]"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6"
              />
              <path
                fill="#34A853"
                d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15"
              />
              <path
                fill="#FBBC04"
                d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"
              />
              <path
                fill="#EA4335"
                d="M72 74V48l24 18 24-18v26L96 92"
              />
              <path
                fill="#C5221F"
                d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"
              />
            </svg>
          </div>
        );
      }

      return (
        <div
          className={`${tileBase} bg-gradient-to-b from-[#38BDF8] to-[#2563EB] text-white`}
        >
          <Mail className="w-5 h-5" />
        </div>
      );
    }

    case 'website':
      return (
        <div
          className={`${tileBase} bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white`}
        >
          <Globe className="w-5 h-5" />
        </div>
      );

    default:
      return (
        <div
          className={`${tileBase} bg-gradient-to-b from-[#8B5CF6] to-[#6366F1] text-white`}
        >
          <Link2 className="w-5 h-5" />
        </div>
      );
  }
};
