import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, QrCode, UserPlus, X } from 'lucide-react';
import { ProfileData } from '../types';

interface ShareQrModalProps {
  open: boolean;
  profile: ProfileData;
  pageUrl: string;
  onClose: () => void;
  onSaveContact: () => void;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({
  open,
  profile,
  pageUrl,
  onClose,
  onSaveContact,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !pageUrl) return;
    let cancelled = false;

    QRCode.toDataURL(pageUrl, {
      width: 560,
      margin: 2,
      color: {
        dark: '#09090B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [open, pageUrl]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const slug =
      profile.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'profile';
    const anchor = document.createElement('a');
    anchor.href = qrDataUrl;
    anchor.download = `${slug}-qr-code.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share Profile and QR Code"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-sm w-full bg-zinc-900 border border-white/12 rounded-3xl p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-white">
              {profile.displayName}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Scan QR or share your personal profile link
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Frame */}
        <div className="mt-5 bg-zinc-950 border border-white/10 rounded-2xl p-5 flex flex-col items-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${profile.displayName}`}
              className="w-48 h-48 rounded-xl bg-white p-2"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500">
              <QrCode className="w-8 h-8" />
            </div>
          )}

          <p className="mt-3 text-xs font-mono text-zinc-400 truncate max-w-full px-2">
            {pageUrl}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={onSaveContact}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Save Contact (.vcf)</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-white/10 rounded-xl hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-white/10 rounded-xl hover:bg-white/15 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
