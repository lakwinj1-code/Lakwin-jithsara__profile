/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { DirectMessageModal } from './components/DirectMessageModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GalleryModal } from './components/GalleryModal';
import { OwnerStudioModal } from './components/OwnerStudioModal';
import { ShareQrModal } from './components/ShareQrModal';
import {
  SignInHelpModal,
  SignInHelpReason,
} from './components/SignInHelpModal';
import { SmartProfileCard } from './components/SmartProfileCard';
import { SquarePhotoCropModal } from './components/SquarePhotoCropModal';
import {
  DEFAULT_GALLERY_ITEMS,
  DEFAULT_PROFILE,
  DEFAULT_SOCIAL_LINKS,
  resolveAssetUrl,
} from './data/defaults';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  SITE_OWNER_EMAIL,
} from './lib/firebase';
import {
  buildWhatsAppLink,
  clampString,
  downloadVCard,
  extractWhatsAppDigitsFromUrl,
  normalizeWhatsAppDigits,
} from './lib/vcardAndImage';
import {
  ContactMessageItem,
  GalleryItem,
  ProfileData,
  SocialLinkItem,
  StudioTab,
} from './types';

function HubExperience() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [links, setLinks] = useState<SocialLinkItem[]>(DEFAULT_SOCIAL_LINKS);
  const [gallery, setGallery] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [, setCloudLoaded] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<StudioTab>('profile');

  // 1:1 Square Cover Photo Cropper State
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [signInHelpOpen, setSignInHelpOpen] = useState(false);
  const [signInHelpReason, setSignInHelpReason] =
    useState<SignInHelpReason>('generic');
  const [signInErrorDetail, setSignInErrorDetail] = useState('');

  const seededOnceRef = useRef(false);

  const isOwner = Boolean(
    currentUser &&
      currentUser.emailVerified &&
      currentUser.email?.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase()
  );

  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : '';

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  // Strip ?fbclid=... and social tracking query clutter from the address bar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const trackingKeys = [
        'fbclid',
        'gclid',
        'igshid',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
      ];
      let removed = false;
      for (const key of trackingKeys) {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          removed = true;
        }
      }
      if (removed) {
        const nextSearch = url.searchParams.toString();
        const cleanHref = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
        window.history.replaceState({}, document.title, cleanHref);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  useEffect(() => {
    if (profile.displayName.trim()) {
      document.title = `${profile.displayName.trim()} — Profile & Links`;
    }
  }, [profile.displayName]);

  // 1. Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. Seed initial cloud data & sync WhatsApp social link once live server connection is confirmed
  useEffect(() => {
    if (
      !authReady ||
      !isOwner ||
      !currentUser ||
      !serverConnected ||
      seededOnceRef.current
    ) {
      return;
    }
    seededOnceRef.current = true;

    const ensureInitialCloudData = async () => {
      try {
        const profileRef = doc(db, 'profiles', 'main');
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          await setDoc(profileRef, {
            displayName: DEFAULT_PROFILE.displayName,
            headline: DEFAULT_PROFILE.headline,
            bio: DEFAULT_PROFILE.bio,
            location: DEFAULT_PROFILE.location,
            availabilityText: DEFAULT_PROFILE.availabilityText,
            contactEmail: DEFAULT_PROFILE.contactEmail,
            contactPhone: DEFAULT_PROFILE.contactPhone,
            whatsappNumber: DEFAULT_PROFILE.whatsappNumber,
            websiteUrl: DEFAULT_PROFILE.websiteUrl,
            avatarUrl: DEFAULT_PROFILE.avatarUrl,
            heroImageUrl: DEFAULT_PROFILE.heroImageUrl,
            isPublished: true,
            ownerUid: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const existingLinks = await getDocs(collection(db, 'socialLinks'));
          if (existingLinks.empty) {
            await Promise.all(
              DEFAULT_SOCIAL_LINKS.map((item) =>
                setDoc(doc(db, 'socialLinks', item.id), {
                  platform: item.platform,
                  label: item.label,
                  handle: item.handle,
                  url: item.url,
                  sortOrder: item.sortOrder,
                  visible: item.visible,
                  ownerUid: currentUser.uid,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
              )
            );
          }

          const existingGallery = await getDocs(collection(db, 'gallery'));
          if (existingGallery.empty) {
            await Promise.all(
              DEFAULT_GALLERY_ITEMS.map((item) =>
                setDoc(doc(db, 'gallery', item.id), {
                  title: item.title,
                  category: item.category,
                  year: item.year,
                  description: item.description,
                  imageUrl: item.imageUrl,
                  externalUrl: item.externalUrl,
                  featured: item.featured,
                  published: item.published,
                  sortOrder: item.sortOrder,
                  ownerUid: currentUser.uid,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                })
              )
            );
          }
          showToast('Profile ready — upload your photo and customize details.');
        } else {
          const savedProfile = profileSnap.data() as ProfileData;
          if (savedProfile.displayName === 'Lakwin Jayasinghe') {
            await updateDoc(profileRef, {
              displayName: DEFAULT_PROFILE.displayName,
              updatedAt: serverTimestamp(),
            });
          }

          // Ensure Direct Contact WhatsApp number is synced into any WhatsApp Social Link
          const profileWaRaw = (savedProfile.whatsappNumber || '').trim();
          const profileWaDigits = normalizeWhatsAppDigits(profileWaRaw);
          if (profileWaDigits && profileWaDigits !== '94770000000') {
            const syncedWaUrl = buildWhatsAppLink(
              profileWaRaw,
              savedProfile.displayName || DEFAULT_PROFILE.displayName
            );
            const existingLinks = await getDocs(collection(db, 'socialLinks'));
            if (!existingLinks.empty) {
              await Promise.all(
                existingLinks.docs.map(async (linkDoc) => {
                  const linkData = linkDoc.data() as Omit<SocialLinkItem, 'id'>;
                  if (linkData.platform !== 'whatsapp') return;
                  const currentLinkDigits = extractWhatsAppDigitsFromUrl(
                    linkData.url || ''
                  );
                  if (currentLinkDigits !== profileWaDigits) {
                    const shouldUpdateHandle =
                      !linkData.handle?.trim() ||
                      linkData.handle.trim() === 'Chat directly on WhatsApp' ||
                      /^[+0-9\s()-]+$/.test(linkData.handle.trim());
                    await updateDoc(doc(db, 'socialLinks', linkDoc.id), {
                      platform: linkData.platform,
                      label: linkData.label,
                      handle: shouldUpdateHandle
                        ? clampString(profileWaRaw, 80)
                        : linkData.handle,
                      url: clampString(syncedWaUrl, 500),
                      sortOrder: linkData.sortOrder,
                      visible: linkData.visible,
                      updatedAt: serverTimestamp(),
                    });
                  }
                })
              );
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('client is offline') ||
          msg.includes('unavailable') ||
          msg.includes('network-request-failed')
        ) {
          // Allow automatic retry next time connectivity settles
          seededOnceRef.current = false;
        } else if (msg.toLowerCase().includes('insufficient permissions')) {
          handleFirestoreError(err, OperationType.WRITE, 'profiles/main');
        }
      }
    };

    void ensureInitialCloudData();
  }, [authReady, isOwner, currentUser, serverConnected]);

  // 3. Real-time listeners for Profile, Social Links, and Gallery
  useEffect(() => {
    if (!authReady) return;
    let hasCloudProfile = false;

    const unsubProfile = onSnapshot(
      doc(db, 'profiles', 'main'),
      (snap) => {
        if (!snap.metadata.fromCache) {
          setServerConnected(true);
        }
        if (snap.exists()) {
          const data = snap.data() as ProfileData;
          hasCloudProfile = true;
          setProfile({
            ...data,
            displayName:
              data.displayName === 'Lakwin Jayasinghe'
                ? DEFAULT_PROFILE.displayName
                : data.displayName,
          });
          setCloudLoaded(true);
        } else {
          hasCloudProfile = false;
          setProfile(DEFAULT_PROFILE);
          setCloudLoaded(false);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'profiles/main');
      }
    );

    const linksQuery = isOwner
      ? collection(db, 'socialLinks')
      : query(collection(db, 'socialLinks'), where('visible', '==', true));

    const unsubLinks = onSnapshot(
      linksQuery,
      (snap) => {
        if (!snap.empty || hasCloudProfile || isOwner) {
          const rows: SocialLinkItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<SocialLinkItem, 'id'>),
          }));
          if (rows.length > 0 || hasCloudProfile) {
            setLinks(rows);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'socialLinks');
      }
    );

    const galleryQuery = isOwner
      ? collection(db, 'gallery')
      : query(collection(db, 'gallery'), where('published', '==', true));

    const unsubGallery = onSnapshot(
      galleryQuery,
      (snap) => {
        if (!snap.empty || hasCloudProfile || isOwner) {
          const rows: GalleryItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<GalleryItem, 'id'>),
          }));
          if (rows.length > 0 || hasCloudProfile) {
            setGallery(rows);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'gallery');
      }
    );

    return () => {
      unsubProfile();
      unsubLinks();
      unsubGallery();
    };
  }, [authReady, isOwner]);

  // 4. Real-time private Messages Inbox listener
  useEffect(() => {
    if (!authReady || !isOwner) {
      setMessages([]);
      return;
    }

    const msgQuery = query(
      collection(db, 'messages'),
      where('targetProfileId', '==', 'main')
    );

    const unsubMessages = onSnapshot(
      msgQuery,
      (snap) => {
        const rows: ContactMessageItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ContactMessageItem, 'id'>),
        }));
        setMessages(rows);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'messages');
      }
    );

    return () => unsubMessages();
  }, [authReady, isOwner]);

  const handleOpenStudio = (tab: StudioTab) => {
    setStudioTab(tab);
    setStudioOpen(true);
  };

  const isEmbeddedSocialWebView = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    return /(FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|MicroMessenger)/i.test(
      navigator.userAgent
    );
  };

  const executeGooglePopupSignIn = async () => {
    setSignInHelpOpen(false);
    setSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (
        result.user.email?.toLowerCase() === SITE_OWNER_EMAIL.toLowerCase() &&
        result.user.emailVerified
      ) {
        setStudioTab('profile');
        setStudioOpen(true);
        showToast('Signed in — upload your 1:1 photo or edit links.');
      } else {
        showToast(
          `Signed in as ${result.user.email || 'visitor'} (read-only view).`
        );
      }
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';
      const message = err instanceof Error ? err.message : String(err);

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        showToast('Google sign-in window was closed.');
      } else if (
        code === 'auth/unauthorized-domain' ||
        message.includes('unauthorized-domain')
      ) {
        setSignInErrorDetail(code || 'auth/unauthorized-domain');
        setSignInHelpReason('unauthorized-domain');
        setSignInHelpOpen(true);
      } else if (
        code === 'auth/popup-blocked' ||
        message.includes('popup-blocked')
      ) {
        setSignInErrorDetail(code || 'auth/popup-blocked');
        setSignInHelpReason('popup-blocked');
        setSignInHelpOpen(true);
      } else if (
        message.toLowerCase().includes('disallowed_useragent') ||
        isEmbeddedSocialWebView()
      ) {
        setSignInErrorDetail(code);
        setSignInHelpReason('in-app-browser');
        setSignInHelpOpen(true);
      } else {
        setSignInErrorDetail(code || message);
        setSignInHelpReason('generic');
        setSignInHelpOpen(true);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleOwnerSignIn = () => {
    if (isEmbeddedSocialWebView()) {
      setSignInErrorDetail('');
      setSignInHelpReason('in-app-browser');
      setSignInHelpOpen(true);
      return;
    }
    void executeGooglePopupSignIn();
  };

  const handleOwnerSignOut = async () => {
    await signOut(auth);
    setStudioOpen(false);
    showToast('Signed out.');
  };

  const handleSaveContact = () => {
    downloadVCard(profile, pageUrl);
    showToast('Contact card (.vcf) downloaded.');
  };

  // Save 1:1 Cropped Square Cover Photo directly to Firestore
  const handleConfirmCroppedPhoto = async (croppedDataUrl: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !isOwner) return;

    setSavingPhoto(true);
    const ref = doc(db, 'profiles', 'main');
    try {
      const snap = await getDoc(ref);
      const baseFields = {
        displayName: clampString(profile.displayName, 80) || 'Lakwin Jithsara',
        headline: clampString(profile.headline, 140) || 'Personal Profile',
        bio:
          clampString(profile.bio, 1200) ||
          'Connect with me directly using the links below.',
        location: clampString(profile.location, 100),
        availabilityText: clampString(profile.availabilityText, 100),
        contactEmail: clampString(profile.contactEmail, 120),
        contactPhone: clampString(profile.contactPhone, 40),
        whatsappNumber: clampString(profile.whatsappNumber, 40),
        websiteUrl: clampString(profile.websiteUrl, 300),
        avatarUrl: clampString(croppedDataUrl, 700000),
        heroImageUrl: clampString(profile.heroImageUrl || 'preset:hero', 700000),
        isPublished: true,
      };

      if (snap.exists()) {
        await updateDoc(ref, {
          ...baseFields,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...baseFields,
          ownerUid: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setPendingPhotoFile(null);
      showToast('1:1 cover photo saved online!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'profiles/main');
    } finally {
      setSavingPhoto(false);
    }
  };

  const unreadCount = messages.filter((m) => m.status === 'unread').length;
  const ambientBgUrl = resolveAssetUrl(profile.avatarUrl, 'preset:avatar');

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#09090B] text-white flex flex-col justify-center py-6 px-4 sm:py-12">
      {/* Amuse-Style Blurred Cover Art Ambient Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      >
        <img
          src={ambientBgUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-125 blur-3xl opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#09090B]/80 to-[#09090B]" />
      </div>

      {/* Non-Owner Authenticated Banner */}
      {currentUser && !isOwner && (
        <div className="relative z-10 max-w-[430px] w-full mx-auto mb-3 px-4 py-2 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-3 text-xs text-zinc-300">
          <span className="truncate">Viewing as {currentUser.email}</span>
          <button
            type="button"
            onClick={handleOwnerSignOut}
            className="font-semibold text-white hover:underline cursor-pointer whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Centered Smart-Link Mini Profile Card */}
      <div className="relative z-10 w-full">
        <SmartProfileCard
          profile={profile}
          links={links}
          gallery={gallery}
          isOwner={isOwner}
          signingIn={signingIn}
          unreadCount={unreadCount}
          onSaveContact={handleSaveContact}
          onOpenShareModal={() => setShareOpen(true)}
          onOpenMessageModal={() => setMessageOpen(true)}
          onOpenGalleryModal={() => setGalleryOpen(true)}
          onOpenStudio={handleOpenStudio}
          onSelectPhotoFile={(file) => setPendingPhotoFile(file)}
          onOwnerSignIn={handleOwnerSignIn}
          onOwnerSignOut={handleOwnerSignOut}
        />
      </div>

      {/* 1:1 Square Cover Photo Cropper Modal */}
      <SquarePhotoCropModal
        open={Boolean(pendingPhotoFile)}
        file={pendingPhotoFile}
        saving={savingPhoto}
        onCancel={() => setPendingPhotoFile(null)}
        onConfirm={handleConfirmCroppedPhoto}
      />

      {/* Direct Visitor Message Modal */}
      <DirectMessageModal
        open={messageOpen}
        recipientName={profile.displayName}
        onClose={() => setMessageOpen(false)}
      />

      {/* Optional Extra Photos Modal */}
      <GalleryModal
        open={galleryOpen}
        items={gallery}
        ownerName={profile.displayName}
        onClose={() => setGalleryOpen(false)}
      />

      {/* Share & QR Code Modal */}
      <ShareQrModal
        open={shareOpen}
        profile={profile}
        pageUrl={pageUrl}
        onClose={() => setShareOpen(false)}
        onSaveContact={handleSaveContact}
      />

      {/* Owner Studio Slide-Over */}
      {isOwner && (
        <OwnerStudioModal
          open={studioOpen}
          initialTab={studioTab}
          profile={profile}
          links={links}
          gallery={gallery}
          messages={messages}
          onClose={() => setStudioOpen(false)}
          onNotify={showToast}
          onSelectSquarePhotoFile={(file) => setPendingPhotoFile(file)}
        />
      )}

      {/* Google Sign-In Helper (Vercel Domain Auth / In-App Browser / Popup Guard) */}
      <SignInHelpModal
        open={signInHelpOpen}
        reason={signInHelpReason}
        errorDetail={signInErrorDetail}
        cleanUrl={pageUrl}
        onClose={() => setSignInHelpOpen(false)}
        onRetrySignIn={() => {
          void executeGooglePopupSignIn();
        }}
      />

      {/* Toast Feedback */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[70] px-4 py-3 bg-white text-zinc-950 text-xs font-semibold rounded-xl shadow-2xl"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HubExperience />
    </ErrorBoundary>
  );
}
