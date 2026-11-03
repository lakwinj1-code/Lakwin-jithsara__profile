import React, { useEffect, useState } from 'react';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  Copy,
  Eye,
  EyeOff,
  MailOpen,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { PRESET_GALLERY_CHOICES, resolveAssetUrl } from '../data/defaults';
import {
  auth,
  createSafeDocId,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  buildWhatsAppLink,
  clampString,
  compressImageFileToDataUrl,
  extractWhatsAppDigitsFromUrl,
  normalizeWhatsAppDigits,
} from '../lib/vcardAndImage';
import {
  ContactMessageItem,
  GalleryItem,
  ProfileData,
  SocialLinkItem,
  SocialPlatform,
  StudioTab,
} from '../types';
import { PlatformIcon, SOCIAL_PLATFORM_OPTIONS } from './PlatformIcon';
import { SafeImage } from './SafeImage';

interface OwnerStudioModalProps {
  open: boolean;
  initialTab: StudioTab;
  profile: ProfileData;
  links: SocialLinkItem[];
  gallery: GalleryItem[];
  messages: ContactMessageItem[];
  onClose: () => void;
  onNotify: (msg: string) => void;
  onSelectSquarePhotoFile: (file: File) => void;
}

export const OwnerStudioModal: React.FC<OwnerStudioModalProps> = ({
  open,
  initialTab,
  profile,
  links,
  gallery,
  messages,
  onClose,
  onNotify,
  onSelectSquarePhotoFile,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);

  // Profile editor state
  const [profileForm, setProfileForm] = useState<ProfileData>(profile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Add New Social Link state
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('instagram');
  const [newLabel, setNewLabel] = useState('Instagram');
  const [newHandle, setNewHandle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newWaNumber, setNewWaNumber] = useState('');
  const [newVisible, setNewVisible] = useState(true);
  const [addingLink, setAddingLink] = useState(false);
  const [addLinkError, setAddLinkError] = useState<string | null>(null);

  // Inline Edit Social Link state (opened directly when clicking the Pencil icon)
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editPlatform, setEditPlatform] = useState<SocialPlatform>('whatsapp');
  const [editLabel, setEditLabel] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editWaNumber, setEditWaNumber] = useState('');
  const [editVisible, setEditVisible] = useState(true);
  const [savingEditLink, setSavingEditLink] = useState(false);
  const [editLinkError, setEditLinkError] = useState<string | null>(null);

  // Add New Gallery Photo state
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState('Photos');
  const [galYear, setGalYear] = useState(String(new Date().getFullYear()));
  const [galDescription, setGalDescription] = useState('');
  const [galImageUrl, setGalImageUrl] = useState('preset:brand');
  const [galExternalUrl, setGalExternalUrl] = useState('');
  const [galPublished, setGalPublished] = useState(true);
  const [savingGallery, setSavingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Inline Edit Gallery Photo state (opened directly when clicking the Pencil icon)
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [editGalTitle, setEditGalTitle] = useState('');
  const [editGalCategory, setEditGalCategory] = useState('Photos');
  const [editGalYear, setEditGalYear] = useState(
    String(new Date().getFullYear())
  );
  const [editGalDescription, setEditGalDescription] = useState('');
  const [editGalImageUrl, setEditGalImageUrl] = useState('preset:brand');
  const [editGalExternalUrl, setEditGalExternalUrl] = useState('');
  const [editGalPublished, setEditGalPublished] = useState(true);
  const [savingEditGallery, setSavingEditGallery] = useState(false);
  const [editGalleryError, setEditGalleryError] = useState<string | null>(null);

  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    setProfileForm(profile);
  }, [profile, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sortedLinks = [...links].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedGallery = [...gallery].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedMessages = [...messages].sort((a, b) => {
    const aMs = a.createdAt?.toMillis?.() ?? 0;
    const bMs = b.createdAt?.toMillis?.() ?? 0;
    return bMs - aMs;
  });
  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  // Ensure default in-memory seed links exist in Firestore before updating/deleting
  const materializeSeedLinksIfNeeded = async (uid: string) => {
    const seedItems = links.filter((item) => item.ownerUid === 'seed');
    if (seedItems.length === 0) return;

    await Promise.all(
      seedItems.map(async (item) => {
        const ref = doc(db, 'socialLinks', item.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            platform: item.platform,
            label: clampString(item.label, 60) || 'Link',
            handle: clampString(item.handle, 80),
            url: clampString(item.url, 500),
            sortOrder: item.sortOrder,
            visible: item.visible,
            ownerUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      })
    );
  };

  // Ensure default in-memory seed gallery items exist in Firestore before updating/deleting
  const materializeSeedGalleryIfNeeded = async (uid: string) => {
    const seedItems = gallery.filter((item) => item.ownerUid === 'seed');
    if (seedItems.length === 0) return;

    await Promise.all(
      seedItems.map(async (item) => {
        const ref = doc(db, 'gallery', item.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            title: clampString(item.title, 100) || 'Photo',
            category: clampString(item.category, 40) || 'Photos',
            year: clampString(item.year, 20),
            description: clampString(item.description, 600),
            imageUrl: clampString(item.imageUrl, 700000),
            externalUrl: clampString(item.externalUrl, 500),
            featured: item.featured,
            published: item.published,
            sortOrder: item.sortOrder,
            ownerUid: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      })
    );
  };

  const upsertSocialLinkDoc = async (
    uid: string,
    linkId: string,
    payload: {
      platform: SocialPlatform;
      label: string;
      handle: string;
      url: string;
      sortOrder: number;
      visible: boolean;
    }
  ) => {
    const ref = doc(db, 'socialLinks', linkId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...payload,
        ownerUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleUploadGalleryImage = async (
    file: File | undefined,
    isEditingRow = false
  ) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 1080, 0.8);
      if (isEditingRow) {
        setEditGalImageUrl(dataUrl);
      } else {
        setGalImageUrl(dataUrl);
      }
      onNotify('Photo processed and ready to save.');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Could not process image.';
      if (isEditingRow) {
        setEditGalleryError(msg);
      } else {
        setGalleryError(msg);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setProfileError('Please sign in as the site owner first.');
      return;
    }

    const cleanDisplayName = clampString(profileForm.displayName, 80);
    const cleanHeadline =
      clampString(profileForm.headline, 140) || 'Personal Profile';
    const cleanBio =
      clampString(profileForm.bio, 1200) ||
      'Connect with me directly using the links below.';
    const cleanContactEmail = clampString(profileForm.contactEmail, 120);
    const cleanContactPhone = clampString(profileForm.contactPhone, 40);
    const cleanWhatsapp = clampString(profileForm.whatsappNumber, 40);

    if (!cleanDisplayName) {
      setProfileError('Display Name is required.');
      return;
    }

    setSavingProfile(true);
    const ref = doc(db, 'profiles', 'main');
    try {
      const existingSnap = await getDoc(ref);
      const baseFields = {
        displayName: cleanDisplayName,
        headline: cleanHeadline,
        bio: cleanBio,
        location: clampString(profileForm.location, 100),
        availabilityText: clampString(profileForm.availabilityText, 100),
        contactEmail: cleanContactEmail,
        contactPhone: cleanContactPhone,
        whatsappNumber: cleanWhatsapp,
        websiteUrl: clampString(profileForm.websiteUrl, 300),
        avatarUrl: clampString(
          profile.avatarUrl || profileForm.avatarUrl,
          700000
        ),
        heroImageUrl: clampString(
          profileForm.heroImageUrl || 'preset:hero',
          700000
        ),
        isPublished: true,
      };

      if (existingSnap.exists()) {
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

      // Sync Direct Contact WhatsApp Number -> All WhatsApp rows in Social Links!
      await materializeSeedLinksIfNeeded(uid);

      if (normalizeWhatsAppDigits(cleanWhatsapp)) {
        const syncedWaUrl = clampString(
          buildWhatsAppLink(cleanWhatsapp, cleanDisplayName),
          500
        );
        const whatsappLinks = links.filter((l) => l.platform === 'whatsapp');

        await Promise.all(
          whatsappLinks.map((waItem) => {
            const shouldUpdateHandle =
              !waItem.handle.trim() ||
              waItem.handle.trim() === 'Chat directly on WhatsApp' ||
              /^[+0-9\s()-]+$/.test(waItem.handle.trim());
            return upsertSocialLinkDoc(uid, waItem.id, {
              platform: 'whatsapp',
              label: clampString(waItem.label, 60) || 'WhatsApp Direct',
              handle: shouldUpdateHandle
                ? clampString(cleanWhatsapp, 80)
                : clampString(waItem.handle, 80),
              url: syncedWaUrl,
              sortOrder: waItem.sortOrder,
              visible: waItem.visible,
            });
          })
        );
      }

      if (cleanContactEmail) {
        const emailLinks = links.filter((l) => l.platform === 'email');
        await Promise.all(
          emailLinks.map((emItem) =>
            upsertSocialLinkDoc(uid, emItem.id, {
              platform: 'email',
              label: clampString(emItem.label, 60) || 'Email',
              handle:
                !emItem.handle.trim() || emItem.handle.includes('@')
                  ? cleanContactEmail
                  : clampString(emItem.handle, 80),
              url: clampString(`mailto:${cleanContactEmail}`, 500),
              sortOrder: emItem.sortOrder,
              visible: emItem.visible,
            })
          )
        );
      }

      onNotify('Profile & WhatsApp social link synced online!');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'profiles/main');
      } catch {
        setProfileError('Failed to save profile. Please verify your inputs.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Social Links Handlers ---
  const resetNewLinkForm = () => {
    setNewPlatform('instagram');
    setNewLabel('Instagram');
    setNewHandle('');
    setNewUrl('');
    setNewWaNumber('');
    setNewVisible(true);
    setAddLinkError(null);
  };

  const handleNewPlatformChange = (nextPlatform: SocialPlatform) => {
    setNewPlatform(nextPlatform);
    const meta = SOCIAL_PLATFORM_OPTIONS.find((p) => p.value === nextPlatform);
    if (meta) {
      setNewLabel(meta.label);
    }
    if (nextPlatform === 'whatsapp') {
      const currentWa = profile.whatsappNumber.trim();
      setNewWaNumber(currentWa);
      if (currentWa) {
        setNewUrl(buildWhatsAppLink(currentWa, profile.displayName));
        if (!newHandle.trim()) setNewHandle(currentWa);
      }
    }
  };

  const handleNewWaNumberChange = (val: string) => {
    setNewWaNumber(val);
    const built = buildWhatsAppLink(val, profile.displayName);
    setNewUrl(built);
    if (!newHandle.trim() || /^[+0-9\s()-]+$/.test(newHandle.trim())) {
      setNewHandle(val);
    }
  };

  const startEditLink = (item: SocialLinkItem) => {
    if (editingLinkId === item.id) {
      setEditingLinkId(null);
      setEditLinkError(null);
      return;
    }

    setEditingLinkId(item.id);
    setEditPlatform(item.platform);
    setEditLabel(item.label);
    setEditHandle(item.handle);
    setEditVisible(item.visible);
    setEditLinkError(null);

    if (item.platform === 'whatsapp') {
      const extractedDigits = extractWhatsAppDigitsFromUrl(item.url);
      const profileWa = profile.whatsappNumber.trim();
      const initialWa =
        profileWa &&
        profileWa !== '+94770000000' &&
        (item.url.includes('94770000000') || !extractedDigits)
          ? profileWa
          : extractedDigits
            ? `+${extractedDigits}`
            : profileWa;
      setEditWaNumber(initialWa);
      setEditUrl(
        initialWa
          ? buildWhatsAppLink(initialWa, profile.displayName)
          : item.url
      );
    } else {
      setEditWaNumber('');
      setEditUrl(item.url);
    }
  };

  const handleEditPlatformChange = (nextPlatform: SocialPlatform) => {
    setEditPlatform(nextPlatform);
    if (nextPlatform === 'whatsapp') {
      const fallbackWa =
        editWaNumber.trim() || profile.whatsappNumber.trim() || '';
      setEditWaNumber(fallbackWa);
      if (fallbackWa) {
        setEditUrl(buildWhatsAppLink(fallbackWa, profile.displayName));
      }
    }
  };

  const handleEditWaNumberChange = (val: string) => {
    setEditWaNumber(val);
    const built = buildWhatsAppLink(val, profile.displayName);
    if (built) {
      setEditUrl(built);
    }
    if (
      !editHandle.trim() ||
      editHandle.trim() === 'Chat directly on WhatsApp' ||
      /^[+0-9\s()-]+$/.test(editHandle.trim())
    ) {
      setEditHandle(val);
    }
  };

  const normalizeOutgoingLinkUrl = (
    platform: SocialPlatform,
    rawUrl: string,
    rawWaNumber: string
  ): string => {
    if (platform === 'whatsapp' && normalizeWhatsAppDigits(rawWaNumber)) {
      return clampString(
        buildWhatsAppLink(rawWaNumber, profile.displayName),
        500
      );
    }
    let cleanUrl = clampString(rawUrl, 500);
    if (!cleanUrl) return '';
    if (
      platform === 'email' &&
      !cleanUrl.startsWith('mailto:') &&
      cleanUrl.includes('@')
    ) {
      cleanUrl = `mailto:${cleanUrl}`;
    } else if (
      platform === 'whatsapp' &&
      /^[+0-9\s()-]+$/.test(cleanUrl) &&
      normalizeWhatsAppDigits(cleanUrl)
    ) {
      cleanUrl = buildWhatsAppLink(cleanUrl, profile.displayName);
    } else if (!/^(https?:\/\/|mailto:|tel:)/i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }
    return clampString(cleanUrl, 500);
  };

  const syncWhatsAppBackToProfile = async (rawWa: string, linkUrl: string) => {
    const cleanWaInput = clampString(
      rawWa.trim() ||
        (extractWhatsAppDigitsFromUrl(linkUrl)
          ? `+${extractWhatsAppDigitsFromUrl(linkUrl)}`
          : ''),
      40
    );
    if (!cleanWaInput) return;

    const profileRef = doc(db, 'profiles', 'main');
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      await updateDoc(profileRef, {
        whatsappNumber: cleanWaInput,
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLinkError(null);
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setAddLinkError('Please sign in as the site owner first.');
      return;
    }

    const cleanLabel = clampString(newLabel, 60);
    const cleanHandle = clampString(newHandle, 80);
    const cleanUrl = normalizeOutgoingLinkUrl(
      newPlatform,
      newUrl,
      newWaNumber
    );

    if (!cleanLabel || !cleanUrl) {
      setAddLinkError(
        newPlatform === 'whatsapp'
          ? 'Display Name and a valid WhatsApp Number are required.'
          : 'Display Name and Link URL are required.'
      );
      return;
    }

    setAddingLink(true);
    try {
      await materializeSeedLinksIfNeeded(uid);
      const newId = createSafeDocId('link');
      const nextOrder =
        sortedLinks.length > 0
          ? Math.max(...sortedLinks.map((l) => l.sortOrder)) + 1
          : 1;

      await setDoc(doc(db, 'socialLinks', newId), {
        platform: newPlatform,
        label: cleanLabel,
        handle: cleanHandle,
        url: cleanUrl,
        sortOrder: nextOrder,
        visible: newVisible,
        ownerUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (newPlatform === 'whatsapp') {
        await syncWhatsAppBackToProfile(newWaNumber, cleanUrl);
      }

      onNotify('Social link added.');
      resetNewLinkForm();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'socialLinks');
      } catch {
        setAddLinkError('Could not add social link.');
      }
    } finally {
      setAddingLink(false);
    }
  };

  const handleSaveEditedLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLinkId) return;
    setEditLinkError(null);

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setEditLinkError('Please sign in as the site owner first.');
      return;
    }

    const cleanLabel = clampString(editLabel, 60);
    const cleanHandle = clampString(editHandle, 80);
    const cleanUrl = normalizeOutgoingLinkUrl(
      editPlatform,
      editUrl,
      editWaNumber
    );

    if (!cleanLabel || !cleanUrl) {
      setEditLinkError(
        editPlatform === 'whatsapp'
          ? 'Display Name and a valid WhatsApp Number are required.'
          : 'Display Name and Link URL are required.'
      );
      return;
    }

    setSavingEditLink(true);
    try {
      await materializeSeedLinksIfNeeded(uid);
      const existingItem = links.find((l) => l.id === editingLinkId);

      await upsertSocialLinkDoc(uid, editingLinkId, {
        platform: editPlatform,
        label: cleanLabel,
        handle: cleanHandle,
        url: cleanUrl,
        sortOrder: existingItem ? existingItem.sortOrder : sortedLinks.length + 1,
        visible: editVisible,
      });

      if (editPlatform === 'whatsapp') {
        await syncWhatsAppBackToProfile(editWaNumber, cleanUrl);
      }

      setEditingLinkId(null);
      onNotify(
        editPlatform === 'whatsapp'
          ? 'WhatsApp link & Direct Contact synced!'
          : 'Social link updated!'
      );
    } catch (err) {
      try {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `socialLinks/${editingLinkId}`
        );
      } catch {
        setEditLinkError('Could not save link changes.');
      }
    } finally {
      setSavingEditLink(false);
    }
  };

  const handleToggleLinkVisibility = async (item: SocialLinkItem) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await materializeSeedLinksIfNeeded(uid);
      await upsertSocialLinkDoc(uid, item.id, {
        platform: item.platform,
        label: clampString(item.label, 60) || 'Link',
        handle: clampString(item.handle, 80),
        url: clampString(item.url, 500),
        sortOrder: item.sortOrder,
        visible: !item.visible,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `socialLinks/${item.id}`);
    }
  };

  const handleMoveLink = async (index: number, direction: -1 | 1) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sortedLinks.length) return;
    const current = sortedLinks[index];
    const target = sortedLinks[swapIndex];
    try {
      await materializeSeedLinksIfNeeded(uid);
      await Promise.all([
        upsertSocialLinkDoc(uid, current.id, {
          platform: current.platform,
          label: clampString(current.label, 60) || 'Link',
          handle: clampString(current.handle, 80),
          url: clampString(current.url, 500),
          visible: current.visible,
          sortOrder: swapIndex + 1,
        }),
        upsertSocialLinkDoc(uid, target.id, {
          platform: target.platform,
          label: clampString(target.label, 60) || 'Link',
          handle: clampString(target.handle, 80),
          url: clampString(target.url, 500),
          visible: target.visible,
          sortOrder: index + 1,
        }),
      ]);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'socialLinks');
    }
  };

  const handleDeleteLink = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await materializeSeedLinksIfNeeded(uid);
      await deleteDoc(doc(db, 'socialLinks', id));
      if (editingLinkId === id) setEditingLinkId(null);
      onNotify('Link removed.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `socialLinks/${id}`);
    }
  };

  // --- Gallery Handlers ---
  const resetNewGalleryForm = () => {
    setGalTitle('');
    setGalCategory('Photos');
    setGalYear(String(new Date().getFullYear()));
    setGalDescription('');
    setGalImageUrl('preset:brand');
    setGalExternalUrl('');
    setGalPublished(true);
    setGalleryError(null);
  };

  const startEditGallery = (item: GalleryItem) => {
    if (editingGalleryId === item.id) {
      setEditingGalleryId(null);
      setEditGalleryError(null);
      return;
    }
    setEditingGalleryId(item.id);
    setEditGalTitle(item.title);
    setEditGalCategory(item.category);
    setEditGalYear(item.year);
    setEditGalDescription(item.description);
    setEditGalImageUrl(item.imageUrl);
    setEditGalExternalUrl(item.externalUrl);
    setEditGalPublished(item.published);
    setEditGalleryError(null);
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalleryError(null);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const cleanTitle = clampString(galTitle, 100);
    const cleanCategory = clampString(galCategory, 40) || 'Photos';
    const cleanImage = clampString(galImageUrl, 700000);
    let cleanExternal = clampString(galExternalUrl, 500);

    if (!cleanTitle || !cleanImage) {
      setGalleryError('Title and Photo are required.');
      return;
    }

    if (cleanExternal && !/^https?:\/\//i.test(cleanExternal)) {
      cleanExternal = `https://${cleanExternal}`;
    }

    setSavingGallery(true);
    try {
      await materializeSeedGalleryIfNeeded(uid);
      const newId = createSafeDocId('work');
      const nextOrder =
        sortedGallery.length > 0
          ? Math.max(...sortedGallery.map((g) => g.sortOrder)) + 1
          : 1;
      await setDoc(doc(db, 'gallery', newId), {
        title: cleanTitle,
        category: cleanCategory,
        year: clampString(galYear, 20),
        description: clampString(galDescription, 600),
        imageUrl: cleanImage,
        externalUrl: cleanExternal,
        featured: false,
        published: galPublished,
        sortOrder: nextOrder,
        ownerUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onNotify('Photo added.');
      resetNewGalleryForm();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'gallery');
      } catch {
        setGalleryError('Could not save photo.');
      }
    } finally {
      setSavingGallery(false);
    }
  };

  const handleSaveEditedGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryId) return;
    setEditGalleryError(null);

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const cleanTitle = clampString(editGalTitle, 100);
    const cleanCategory = clampString(editGalCategory, 40) || 'Photos';
    const cleanImage = clampString(editGalImageUrl, 700000);
    let cleanExternal = clampString(editGalExternalUrl, 500);

    if (!cleanTitle || !cleanImage) {
      setEditGalleryError('Title and Photo are required.');
      return;
    }

    if (cleanExternal && !/^https?:\/\//i.test(cleanExternal)) {
      cleanExternal = `https://${cleanExternal}`;
    }

    setSavingEditGallery(true);
    try {
      await materializeSeedGalleryIfNeeded(uid);
      const existingItem = gallery.find((g) => g.id === editingGalleryId);
      const ref = doc(db, 'gallery', editingGalleryId);
      const snap = await getDoc(ref);

      const payload = {
        title: cleanTitle,
        category: cleanCategory,
        year: clampString(editGalYear, 20),
        description: clampString(editGalDescription, 600),
        imageUrl: cleanImage,
        externalUrl: cleanExternal,
        featured: existingItem ? existingItem.featured : false,
        published: editGalPublished,
        sortOrder: existingItem
          ? existingItem.sortOrder
          : sortedGallery.length + 1,
      };

      if (snap.exists()) {
        await updateDoc(ref, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...payload,
          ownerUid: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setEditingGalleryId(null);
      onNotify('Photo updated.');
    } catch (err) {
      try {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `gallery/${editingGalleryId}`
        );
      } catch {
        setEditGalleryError('Could not save photo changes.');
      }
    } finally {
      setSavingEditGallery(false);
    }
  };

  const handleToggleGalleryPublished = async (item: GalleryItem) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await materializeSeedGalleryIfNeeded(uid);
      await updateDoc(doc(db, 'gallery', item.id), {
        featured: item.featured,
        published: !item.published,
        sortOrder: item.sortOrder,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `gallery/${item.id}`);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await materializeSeedGalleryIfNeeded(uid);
      await deleteDoc(doc(db, 'gallery', id));
      if (editingGalleryId === id) setEditingGalleryId(null);
      onNotify('Photo deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `gallery/${id}`);
    }
  };

  // --- Inbox Handlers ---
  const handleUpdateMessageStatus = async (
    msg: ContactMessageItem,
    nextStatus: 'read' | 'archived'
  ) => {
    if (msg.status === 'archived') return;
    try {
      await updateDoc(doc(db, 'messages', msg.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      onNotify(
        nextStatus === 'archived' ? 'Message archived.' : 'Marked as read.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `messages/${msg.id}`);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
      onNotify('Message deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `messages/${id}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit Mini Profile"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-zinc-900 text-white h-full border-l border-white/12 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Studio Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-white">
              Edit Mini Profile
            </h2>
            <p className="text-xs text-zinc-400">
              All changes save online immediately for your shared link
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="px-6 py-3 bg-zinc-950/60 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {(
            [
              { id: 'profile', label: 'Photo & Contact' },
              { id: 'links', label: `Social Links (${links.length})` },
              { id: 'gallery', label: `Extra Photos (${gallery.length})` },
              {
                id: 'inbox',
                label:
                  unreadCount > 0
                    ? `Messages (${unreadCount} new)`
                    : `Messages (${messages.length})`,
              },
            ] as { id: StudioTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white text-zinc-950'
                  : 'text-zinc-400 hover:text-white hover:bg-white/8'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Studio Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: PHOTO & CONTACT DETAILS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Prominent Cover Photo Uploader */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/15 shrink-0 bg-zinc-900">
                  <SafeImage
                    src={resolveAssetUrl(profile.avatarUrl, 'preset:avatar')}
                    alt="Cover Photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    Cover Photo
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">
                    Displayed in the cover-art frame at the top of your card and blurred in the background.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap">
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <span>Upload Your Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onSelectSquarePhotoFile(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={profileForm.displayName}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        displayName: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Title / Subtitle
                  </label>
                  <input
                    type="text"
                    maxLength={140}
                    value={profileForm.headline}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, headline: e.target.value }))
                    }
                    placeholder="Creator / Designer"
                    className="w-full px-3.5 py-2.5 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Short Bio
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                    {profileForm.bio.length} / 1200
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={1200}
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="A short note about you..."
                  className="w-full px-3.5 py-2.5 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40 resize-y"
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs font-semibold text-zinc-300 mb-1">
                  Direct Contact Rows (Shown on Card &amp; Save Contact vCard)
                </p>
                <p className="text-[11px] text-zinc-400 mb-3">
                  Updating your WhatsApp number here also updates your WhatsApp row in Social Links automatically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Phone Number (Call Row)
                    </label>
                    <input
                      type="tel"
                      maxLength={40}
                      value={profileForm.contactPhone}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          contactPhone: e.target.value,
                        }))
                      }
                      placeholder="+94 77 123 4567"
                      className="w-full px-3.5 py-2 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      WhatsApp Number (e.g. +94771234567 or 0771234567)
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      value={profileForm.whatsappNumber}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          whatsappNumber: e.target.value,
                        }))
                      }
                      placeholder="+94771234567"
                      className="w-full px-3.5 py-2 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Email Address (Email Row)
                    </label>
                    <input
                      type="email"
                      maxLength={120}
                      value={profileForm.contactEmail}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          contactEmail: e.target.value,
                        }))
                      }
                      placeholder="you@gmail.com"
                      className="w-full px-3.5 py-2 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={profileForm.location}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Colombo, Sri Lanka"
                      className="w-full px-3.5 py-2 text-sm text-white bg-zinc-950 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>
              </div>

              {profileError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-medium text-red-300">
                  {profileError}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>
                    {savingProfile ? 'Saving...' : 'Save Contact & Profile'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SOCIAL LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              {/* Add New Social Media Row Form */}
              <form
                onSubmit={handleAddLink}
                className="p-4 bg-zinc-950 border border-white/10 rounded-2xl space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Add Social Media Row
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    Click the pencil icon below to edit existing rows
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Platform
                    </label>
                    <select
                      value={newPlatform}
                      onChange={(e) =>
                        handleNewPlatformChange(
                          e.target.value as SocialPlatform
                        )
                      }
                      className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                    >
                      {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Instagram"
                      className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                {newPlatform === 'whatsapp' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        WhatsApp Number *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={40}
                        value={newWaNumber}
                        onChange={(e) => handleNewWaNumberChange(e.target.value)}
                        placeholder="+94 77 123 4567 or 0771234567"
                        className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Subtitle / Handle
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        value={newHandle}
                        onChange={(e) => setNewHandle(e.target.value)}
                        placeholder="Chat directly on WhatsApp"
                        className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Handle / Subtitle
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        value={newHandle}
                        onChange={(e) => setNewHandle(e.target.value)}
                        placeholder="@username"
                        className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Link URL *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={500}
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                      />
                    </div>
                  </div>
                )}

                {addLinkError && (
                  <p className="text-xs font-medium text-red-400">
                    {addLinkError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newVisible}
                      onChange={(e) => setNewVisible(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    <span>Show on profile card</span>
                  </label>

                  <button
                    type="submit"
                    disabled={addingLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>{addingLink ? 'Adding...' : 'Add Link'}</span>
                  </button>
                </div>
              </form>

              {/* Existing Social Links List with Inline Pencil Editor */}
              <div className="space-y-2.5">
                {sortedLinks.map((item, idx) => {
                  const isEditingThisRow = editingLinkId === item.id;
                  const displayUrlPreview =
                    item.platform === 'whatsapp' &&
                    profile.whatsappNumber.trim() &&
                    profile.whatsappNumber.trim() !== '+94770000000' &&
                    item.url.includes('94770000000')
                      ? buildWhatsAppLink(
                          profile.whatsappNumber,
                          profile.displayName
                        )
                      : item.url;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border transition-colors ${
                        isEditingThisRow
                          ? 'bg-zinc-950 border-white/40 p-3.5'
                          : 'bg-zinc-950 border-white/10 p-3'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                            <PlatformIcon
                              platform={item.platform}
                              className="w-4 h-4"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {item.label}
                              {!item.visible && (
                                <span className="ml-2 text-xs font-normal text-zinc-500">
                                  · Hidden
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              {displayUrlPreview}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveLink(idx, -1)}
                            disabled={idx === 0}
                            aria-label="Move up"
                            title="Move up"
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveLink(idx, 1)}
                            disabled={idx === sortedLinks.length - 1}
                            aria-label="Move down"
                            title="Move down"
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleLinkVisibility(item)}
                            aria-label={item.visible ? 'Hide' : 'Show'}
                            title={item.visible ? 'Hide link' : 'Show link'}
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 cursor-pointer"
                          >
                            {item.visible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditLink(item)}
                            aria-label={`Edit ${item.label}`}
                            title={`Edit ${item.label}`}
                            className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                              isEditingThisRow
                                ? 'bg-white text-zinc-950'
                                : 'text-zinc-300 hover:text-white hover:bg-white/12'
                            }`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLink(item.id)}
                            aria-label="Delete"
                            title="Delete link"
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/8 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Edit Panel Directly Inside the Row */}
                      {isEditingThisRow && (
                        <form
                          onSubmit={handleSaveEditedLink}
                          className="mt-3.5 pt-3.5 border-t border-white/12 space-y-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Platform
                              </label>
                              <select
                                value={editPlatform}
                                onChange={(e) =>
                                  handleEditPlatformChange(
                                    e.target.value as SocialPlatform
                                  )
                                }
                                className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/15 rounded-xl focus:outline-none focus:border-white/45"
                              >
                                {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Display Name *
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={60}
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/15 rounded-xl focus:outline-none focus:border-white/45"
                              />
                            </div>
                          </div>

                          {editPlatform === 'whatsapp' && (
                            <div>
                              <label className="block text-xs font-medium text-zinc-200 mb-1">
                                WhatsApp Number (Auto-updates WhatsApp Link &amp; Direct Contact) *
                              </label>
                              <input
                                type="text"
                                autoFocus
                                maxLength={40}
                                value={editWaNumber}
                                onChange={(e) =>
                                  handleEditWaNumberChange(e.target.value)
                                }
                                placeholder="+94 77 123 4567 or 0771234567"
                                className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/25 rounded-xl focus:outline-none focus:border-white"
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Handle / Subtitle
                              </label>
                              <input
                                type="text"
                                maxLength={80}
                                value={editHandle}
                                onChange={(e) => setEditHandle(e.target.value)}
                                placeholder="@username"
                                className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/15 rounded-xl focus:outline-none focus:border-white/45"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Link URL *
                              </label>
                              <input
                                type="text"
                                required
                                autoFocus={editPlatform !== 'whatsapp'}
                                maxLength={500}
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/15 rounded-xl focus:outline-none focus:border-white/45"
                              />
                            </div>
                          </div>

                          {editLinkError && (
                            <p className="text-xs font-medium text-red-400">
                              {editLinkError}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editVisible}
                                onChange={(e) =>
                                  setEditVisible(e.target.checked)
                                }
                                className="rounded border-white/20"
                              />
                              <span>Show on profile card</span>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLinkId(null);
                                  setEditLinkError(null);
                                }}
                                className="px-3.5 py-2 text-xs font-semibold text-zinc-300 bg-white/8 hover:bg-white/14 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={savingEditLink}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Save className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {savingEditLink ? 'Saving...' : 'Save Changes'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: OPTIONAL EXTRA PHOTOS */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <p className="text-xs text-zinc-400">
                Optional extra photos shown inside the &ldquo;Photos&rdquo; popup button. Hide or delete all items if you prefer only the single top cover photo.
              </p>

              <form
                onSubmit={handleAddGallery}
                className="p-4 bg-zinc-950 border border-white/10 rounded-2xl space-y-3.5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/15 shrink-0">
                    <SafeImage
                      src={resolveAssetUrl(galImageUrl, 'preset:brand')}
                      alt="Selected photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-white rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5 shrink-0" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleUploadGalleryImage(e.target.files?.[0], false)
                        }
                      />
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_GALLERY_CHOICES.slice(0, 2).map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setGalImageUrl(p.key)}
                          className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={galTitle}
                      onChange={(e) => setGalTitle(e.target.value)}
                      placeholder="Photo caption"
                      className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      External Link (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={500}
                      value={galExternalUrl}
                      onChange={(e) => setGalExternalUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/12 rounded-xl focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                {galleryError && (
                  <p className="text-xs font-medium text-red-400">
                    {galleryError}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingGallery}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>{savingGallery ? 'Adding...' : 'Add Photo'}</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                {sortedGallery.map((item) => {
                  const isEditingPhoto = editingGalleryId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border transition-colors ${
                        isEditingPhoto
                          ? 'bg-zinc-950 border-white/40 p-3.5'
                          : 'bg-zinc-950 border-white/10 p-3'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <SafeImage
                              src={resolveAssetUrl(item.imageUrl, 'preset:brand')}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {item.published ? 'Visible' : 'Hidden'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleGalleryPublished(item)}
                            title={item.published ? 'Hide photo' : 'Show photo'}
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 cursor-pointer"
                          >
                            {item.published ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditGallery(item)}
                            aria-label={`Edit ${item.title}`}
                            title={`Edit ${item.title}`}
                            className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                              isEditingPhoto
                                ? 'bg-white text-zinc-950'
                                : 'text-zinc-300 hover:text-white hover:bg-white/12'
                            }`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGallery(item.id)}
                            title="Delete photo"
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/8 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isEditingPhoto && (
                        <form
                          onSubmit={handleSaveEditedGallery}
                          className="mt-3.5 pt-3.5 border-t border-white/12 space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 shrink-0">
                              <SafeImage
                                src={resolveAssetUrl(
                                  editGalImageUrl,
                                  'preset:brand'
                                )}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-white rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap">
                              <Upload className="w-3.5 h-3.5 shrink-0" />
                              <span>Replace Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleUploadGalleryImage(
                                    e.target.files?.[0],
                                    true
                                  )
                                }
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Title *
                              </label>
                              <input
                                type="text"
                                required
                                autoFocus
                                maxLength={100}
                                value={editGalTitle}
                                onChange={(e) =>
                                  setEditGalTitle(e.target.value)
                                }
                                className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/15 rounded-xl focus:outline-none focus:border-white/45"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                External Link (Optional)
                              </label>
                              <input
                                type="text"
                                maxLength={500}
                                value={editGalExternalUrl}
                                onChange={(e) =>
                                  setEditGalExternalUrl(e.target.value)
                                }
                                placeholder="https://..."
                                className="w-full px-3 py-2 text-sm text-white bg-zinc-900 border border-white/15 rounded-xl focus:outline-none focus:border-white/45"
                              />
                            </div>
                          </div>

                          {editGalleryError && (
                            <p className="text-xs font-medium text-red-400">
                              {editGalleryError}
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGalleryId(null);
                                setEditGalleryError(null);
                              }}
                              className="px-3.5 py-2 text-xs font-semibold text-zinc-300 bg-white/8 hover:bg-white/14 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingEditGallery}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Save className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {savingEditGallery
                                  ? 'Saving...'
                                  : 'Save Changes'}
                              </span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MESSAGES INBOX */}
          {activeTab === 'inbox' && (
            <div className="space-y-3.5">
              {sortedMessages.length === 0 ? (
                <div className="py-12 text-center bg-zinc-950 border border-white/10 rounded-2xl p-6">
                  <p className="text-sm font-medium text-zinc-300">
                    No messages yet
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Direct messages from visitors will appear here.
                  </p>
                </div>
              ) : (
                sortedMessages.map((msg) => {
                  const dateLabel = msg.createdAt?.toDate
                    ? msg.createdAt.toDate().toLocaleString()
                    : 'Just now';

                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl border ${
                        msg.status === 'unread'
                          ? 'bg-zinc-950 border-white/30'
                          : 'bg-zinc-950/60 border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            <span className="font-semibold text-white text-sm">
                              {msg.senderName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{dateLabel}</span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            <a
                              href={`mailto:${msg.senderEmail}`}
                              className="text-blue-400 hover:underline"
                            >
                              {msg.senderEmail}
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.senderEmail);
                                setCopiedMsgId(msg.id);
                                setTimeout(() => setCopiedMsgId(null), 1600);
                              }}
                              className="p-1 text-zinc-500 hover:text-white cursor-pointer"
                              title="Copy email"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {msg.senderPhone.trim() && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {msg.senderPhone.trim()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {msg.status === 'unread' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateMessageStatus(msg, 'read')}
                              title="Mark as read"
                              className="p-1.5 text-zinc-300 hover:text-white bg-white/8 rounded-lg cursor-pointer"
                            >
                              <MailOpen className="w-4 h-4" />
                            </button>
                          )}
                          {msg.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateMessageStatus(msg, 'archived')
                              }
                              title="Archive"
                              className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Delete"
                            className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                        {msg.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
