import { ProfileData } from '../types';

function escapeVCardField(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export function downloadVCard(profile: ProfileData, pageUrl: string): void {
  const fullName = profile.displayName.trim() || 'Contact';
  const nameParts = fullName.split(/\s+/);
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const firstName = nameParts[0] || fullName;

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardField(lastName)};${escapeVCardField(firstName)};;;`,
    `FN:${escapeVCardField(fullName)}`,
  ];

  if (profile.headline.trim()) {
    lines.push(`TITLE:${escapeVCardField(profile.headline.trim())}`);
  }
  if (profile.contactPhone.trim()) {
    lines.push(`TEL;TYPE=CELL,VOICE:${profile.contactPhone.trim()}`);
  } else if (profile.whatsappNumber.trim()) {
    lines.push(`TEL;TYPE=CELL,VOICE:${profile.whatsappNumber.trim()}`);
  }
  if (profile.contactEmail.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET:${profile.contactEmail.trim()}`);
  }

  const primaryWebsite = profile.websiteUrl.trim() || pageUrl;
  if (primaryWebsite) {
    lines.push(`URL:${primaryWebsite}`);
  }
  if (profile.location.trim()) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardField(profile.location.trim())};;;;`);
  }
  if (profile.bio.trim()) {
    lines.push(`NOTE:${escapeVCardField(profile.bio.trim().slice(0, 350))}`);
  }

  lines.push('END:VCARD');

  const vcfContent = lines.join('\r\n');
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);

  const safeSlug =
    fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'contact';

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${safeSlug}.vcf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

export function normalizeWhatsAppDigits(rawNumber: string): string {
  const compact = rawNumber.trim().replace(/[\s()-]/g, '');
  if (!compact) return '';

  if (compact.startsWith('00')) {
    return compact.slice(2).replace(/[^0-9]/g, '');
  }

  // Convert 10-digit Sri Lankan local numbers (e.g. 0771234567) to international 94771234567
  if (/^0[1-9][0-9]{8}$/.test(compact)) {
    return `94${compact.slice(1)}`;
  }

  return compact.replace(/[^0-9]/g, '');
}

export function extractWhatsAppDigitsFromUrl(url: string): string {
  const trimmed = url.trim();
  const waMatch = trimmed.match(/wa\.me\/([0-9]+)/i);
  if (waMatch?.[1]) return waMatch[1];
  const phoneParamMatch = trimmed.match(/[?&]phone=([0-9]+)/i);
  if (phoneParamMatch?.[1]) return phoneParamMatch[1];
  return '';
}

export function buildWhatsAppLink(rawNumber: string, displayName: string): string {
  const digits = normalizeWhatsAppDigits(rawNumber);
  if (!digits) return '';
  const cleanName = displayName.trim() || 'there';
  const greeting = encodeURIComponent(
    `Hi ${cleanName}, I visited your profile page and wanted to get in touch.`
  );
  return `https://wa.me/${digits}?text=${greeting}`;
}

export async function compressImageFileToDataUrl(
  file: File,
  maxDimension = 1100,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a valid image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Image compression is unavailable in this browser.'));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 620000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.62);
        }
        if (dataUrl.length > 680000) {
          reject(new Error('Compressed image is still too large. Please try a smaller photo.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function clampString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}
