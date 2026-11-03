import React, { useEffect, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { CheckCircle2, Send, X } from 'lucide-react';
import {
  createSafeDocId,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { clampString } from '../lib/vcardAndImage';

interface DirectMessageModalProps {
  open: boolean;
  recipientName: string;
  onClose: () => void;
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  open,
  recipientName,
  onClose,
}) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = clampString(senderName, 80);
    const cleanEmail = clampString(senderEmail, 120);
    const cleanPhone = clampString(senderPhone, 40);
    const cleanMessage = clampString(message, 2000);

    if (!cleanName) {
      setFormError('Please enter your name.');
      return;
    }
    if (!cleanEmail || cleanEmail.length < 3 || !EMAIL_PATTERN.test(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!cleanMessage) {
      setFormError('Please write a message before sending.');
      return;
    }

    setSubmitting(true);
    const messageId = createSafeDocId('msg');
    const docPath = `messages/${messageId}`;

    try {
      await setDoc(doc(db, 'messages', messageId), {
        senderName: cleanName,
        senderEmail: cleanEmail,
        senderPhone: cleanPhone,
        subject: '',
        message: cleanMessage,
        status: 'unread',
        targetProfileId: 'main',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubmitted(true);
      setSenderName('');
      setSenderEmail('');
      setSenderPhone('');
      setMessage('');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      } catch {
        setFormError('Unable to send message right now. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Send message to ${recipientName}`}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-white/12 rounded-3xl p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-white">
              Message {recipientName}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Send a direct note straight to my inbox
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close message dialog"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-white">
              Message Sent
            </h3>
            <p className="mt-1.5 text-xs text-zinc-400">
              Thank you! {recipientName} has received your message.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-200 bg-white/10 rounded-xl hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
              >
                Send Another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40 placeholder:text-zinc-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  maxLength={120}
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full px-3.5 py-2.5 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40 placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  maxLength={40}
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="+94 77..."
                  className="w-full px-3.5 py-2.5 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40 placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Message *
                </label>
                <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                  {message.length} / 2000
                </span>
              </div>
              <textarea
                rows={3}
                required
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a quick message..."
                className="w-full px-3.5 py-2.5 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40 placeholder:text-zinc-500 resize-y"
              />
            </div>

            {formError && (
              <p className="text-xs font-medium text-red-400">{formError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] text-sm font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>{submitting ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
