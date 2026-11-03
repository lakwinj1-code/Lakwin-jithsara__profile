import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { FIREBASE_PROJECT_ID } from '../lib/firebase';

export type SignInHelpReason =
  | 'unauthorized-domain'
  | 'in-app-browser'
  | 'popup-blocked'
  | 'generic';

interface SignInHelpModalProps {
  open: boolean;
  reason: SignInHelpReason;
  errorDetail?: string;
  cleanUrl: string;
  onClose: () => void;
  onRetrySignIn: () => void;
}

export const SignInHelpModal: React.FC<SignInHelpModalProps> = ({
  open,
  reason,
  errorDetail = '',
  cleanUrl,
  onClose,
  onRetrySignIn,
}) => {
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const currentDomain =
    typeof window !== 'undefined' ? window.location.hostname : '';
  const isAndroid =
    typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const chromeIntentUrl =
    typeof window !== 'undefined'
      ? `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`
      : cleanUrl;

  const firebaseAuthSettingsUrl = `https://console.firebase.google.com/project/${encodeURIComponent(
    FIREBASE_PROJECT_ID
  )}/authentication/settings`;

  const handleCopyDomain = () => {
    if (!currentDomain) return;
    navigator.clipboard.writeText(currentDomain).then(() => {
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 1800);
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(cleanUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-help-title"
    >
      <div
        className="w-full max-w-[410px] rounded-3xl bg-[#141418] border border-white/12 p-5 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/25 text-amber-300 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2
              id="signin-help-title"
              className="font-display text-base font-bold text-white truncate"
            >
              {reason === 'unauthorized-domain'
                ? 'Authorize Domain for Login'
                : reason === 'in-app-browser'
                  ? 'Open in Chrome or Safari'
                  : 'Complete Google Sign-In'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[36px] min-h-[36px] rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {reason === 'unauthorized-domain' && (
          <div className="mt-3.5 space-y-3 text-xs text-zinc-300 leading-relaxed">
            <p>
              Firebase blocks Google Sign-In on new custom domains until you
              approve the domain once in your Firebase project settings.
            </p>

            <div className="rounded-xl bg-black/45 border border-white/10 px-3 py-2.5 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-white truncate">
                {currentDomain}
              </span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/18 text-white font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedDomain ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Domain</span>
                  </>
                )}
              </button>
            </div>

            <ol className="space-y-1.5 text-zinc-400 list-decimal list-inside">
              <li>
                Open{' '}
                <strong className="text-zinc-200 font-medium">
                  Firebase Authentication → Settings
                </strong>
                .
              </li>
              <li>
                Scroll to{' '}
                <strong className="text-zinc-200 font-medium">
                  Authorized domains
                </strong>{' '}
                and click{' '}
                <strong className="text-zinc-200 font-medium">
                  Add domain
                </strong>
                .
              </li>
              <li>
                Paste <span className="font-mono text-zinc-200">{currentDomain}</span>{' '}
                and save, then retry below.
              </li>
            </ol>

            <div className="pt-1 flex flex-col gap-2">
              <a
                href={firebaseAuthSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] rounded-xl bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors whitespace-nowrap"
              >
                <span>Open Firebase Auth Settings</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              <button
                type="button"
                onClick={onRetrySignIn}
                className="w-full min-h-[42px] rounded-xl bg-white/10 border border-white/12 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-white/16 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Try Google Sign-In Again</span>
              </button>
            </div>
          </div>
        )}

        {reason === 'in-app-browser' && (
          <div className="mt-3.5 space-y-3 text-xs text-zinc-300 leading-relaxed">
            <p>
              Google blocks sign-in inside Facebook, Messenger, and Instagram
              built-in browsers for account security. Open this link in{' '}
              <strong className="text-white font-semibold">Chrome</strong> or{' '}
              <strong className="text-white font-semibold">Safari</strong> to
              log in as Owner.
            </p>

            <div className="pt-1 flex flex-col gap-2">
              {isAndroid && (
                <a
                  href={chromeIntentUrl}
                  className="w-full min-h-[44px] rounded-xl bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors whitespace-nowrap"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>Open Directly in Chrome</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleCopyUrl}
                className="w-full min-h-[42px] rounded-xl bg-white/10 border border-white/12 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-white/16 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Link Copied — Paste in Browser</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link for Chrome / Safari</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onRetrySignIn}
                className="w-full min-h-[40px] rounded-xl text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Try Google Popup Anyway
              </button>
            </div>
          </div>
        )}

        {(reason === 'popup-blocked' || reason === 'generic') && (
          <div className="mt-3.5 space-y-3 text-xs text-zinc-300 leading-relaxed">
            <p>
              {reason === 'popup-blocked'
                ? 'Your browser blocked the Google Sign-In popup window. Tap the button below to allow the Google login window.'
                : 'Google Sign-In could not finish. Please ensure popups are allowed and you are using Chrome or Safari.'}
            </p>

            {errorDetail && (
              <p className="font-mono text-[11px] text-zinc-400 bg-black/40 border border-white/8 rounded-xl px-3 py-2 break-words">
                {errorDetail}
              </p>
            )}

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={onRetrySignIn}
                className="w-full min-h-[44px] rounded-xl bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
