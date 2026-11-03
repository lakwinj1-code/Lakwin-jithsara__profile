# Personal Link-in-Bio & Portfolio Hub

A sleek, all-in-one personal hub and portfolio website in English where visitors can learn about you, connect across all your social media channels, view your photo and project gallery, save your contact card via QR/vCard, and message you directly—backed by live cloud storage so any edits you make appear immediately for everyone who opens your link.

### User Review & Critical Decisions

> [!IMPORTANT]
> Because your profile updates and incoming visitor messages will be saved online for everyone visiting your link, **Firebase (Firestore & Google Sign-In)** will be provisioned right after you approve this plan so only your verified Google account can edit your page and read private messages.

- **Confirmed — Website Language**: **English only** across all navigation, profile sections, interactive actions, and the owner editor.
- **Confirmed — Layout & Aesthetic**: **Modern Link-in-Bio + Personal Portfolio** combining a full-bleed split-screen editorial hero, structured social link cards, and a Bento showcase gallery rather than a cramped mobile-only card.
- **Confirmed — Cloud Persistence**: **Online Live Sync (Firebase)** so updates to your bio, contact info, social links, and gallery are immediately visible to anyone opening your shared link on any device.
- **Confirmed — Core Capabilities**: **Direct Contact Form** (with private owner inbox), **QR Code Modal & One-Click Save Contact (`.vcf` vCard)**, and **Photo & Creative Works Gallery** with fullscreen lightbox viewing.

---

### 1. Overview & Core Concept

- **What It Does**: Combines the instant scannability of a Link-in-Bio hub with the visual depth of a personal portfolio. Visitors get a single destination for your biography, social media profiles, direct contact channels, downloadable digital business card, QR code, and visual work showcase. Meanwhile, signing in as the owner unlocks an integrated **Owner Studio** where you can edit every detail, reorder or add social links, curate gallery items, and read messages sent through the contact form.
- **Target Audience / Persona**:
  - **You (Site Owner)**: Wants a zero-code, self-editable personal headquarters that stays up to date across social bios, business cards, and resumes.
  - **Visitors, Clients & Collaborators**: Want an immediate, trustworthy way to read about who you are, browse your work, connect on their preferred social platform, save your contact details to their phone, or send a direct inquiry.
- **Key Value**: Eliminates scattered links and static pages—giving you one authoritative, polished personal URL that works seamlessly on both mobile phones and wide desktop screens.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Visitor Discovery & Connection**: A visitor lands on the split-screen hero featuring your portrait, headline, bio, location, and availability note. From there they can click **Save Contact (vCard)** to add your details straight to their phone, open the **Share & QR Code** modal to scan or copy your link, tap any **Social & Channel Link** (WhatsApp, Instagram, LinkedIn, Facebook, YouTube, GitHub, X, Website, etc.), browse your **Selected Works & Photo Gallery** (with category filtering and a fullscreen Lightbox viewer), or send an inquiry via the **Direct Contact Form**.
  2. **Owner Authentication & Live Editing**: Clicking the discreet **Owner Studio** link in the footer signs you in via Google Popup Authentication. Once verified as the site owner, a clean management toolbar and slide-over editor unlock:
     - **Profile & Contact Details Editor**: Update your display name, role/headline, about story, location, public contact email, phone/WhatsApp number, and portrait/cover visuals.
     - **Social Links Manager**: Add, edit, toggle visibility, reorder, or delete social media links with automatic platform icon recognition and custom labels/handles.
     - **Gallery & Works Curator**: Add new photos or creative projects with title, category, year/description, optional external project URL, and image upload/selection, or remove outdated items.
     - **Direct Message Inbox**: Read incoming contact form submissions from visitors, copy sender details to reply, mark messages as read, or delete them.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Crisp Editorial Monograph meets Modern Creator Hub—clean architectural lines, generous whitespace, media-first framing, and zero visual clutter.
  - *Color Palette & Mood (60-30-10 Discipline)*:
    - **60% Dominant Neutral Canvas**: Crisp alabaster off-white (`--background`: `#FAFAFA` / `zinc-50`) with pure white structural surfaces (`#FFFFFF`) so photography and social brand touchpoints stand out cleanly.
    - **30% Structural Surfaces & Framing**: Hairline zinc borders (`#E4E4E7` / `zinc-200`), deep ink typography (`#09090B` / `zinc-950`), and subdued secondary prose (`#52525B` / `zinc-600`).
    - **10% Focal Accent**: High-contrast Electric Cobalt (`--accent`: `#2563EB` / `blue-600`) reserved strictly for primary CTAs (`Save Contact`, `Send Message`, `Save Changes`) and active interactive states.
  - *Typography & Hierarchy*:
    - **Display & Headings**: `Bricolage Grotesque` (bold, tight tracking, `text-wrap: balance`) for your name, hero statement, and section headers.
    - **Body Prose & Controls**: `Plus Jakarta Sans` (15px–16px, relaxed line-height) for approachable, crisp readability across bio copy, link cards, and forms.
    - **Metrics & Contact Coordinates**: `JetBrains Mono` (`tabular-nums`) for years, counts, and structured coordinates.
    - **Zero-Pill Metadata**: Categories, years, and location details render as clean unboxed inline text separated by `·` rather than cluttered badge pills.
  - *Component Styling & Spatial Layout*:
    - **Top Bar Contract**: Strict single-row, 3-zone header (`gap-8`): `[Your Name Wordmark]` — `[About · Links · Gallery · Contact]` — `[Share / QR Button]`.
    - **1440px Desktop Presence + Mobile-First Ergonomics**: Full two-column `items-stretch` split hero on desktop (`1200px` max container) paired with a multi-column social link hub and dynamic Bento gallery (`col-span-2 row-span-2` featured tile alongside `col-span-1` cards), scaling gracefully down to single-column thumb-friendly touch targets ($\ge 44\text{px}$) on mobile.

- **Interactive Feedback & Motion**:
  - Fast, compositor-only (`transform`, `opacity`) transitions settling within `150ms–200ms`.
  - Instant clipboard confirmation ("Link copied to clipboard"), vCard download trigger, smooth fullscreen gallery lightbox with `ESC` key support, inline form validation, and clear toast notifications on profile saves and message submissions.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Public Single-Profile Hub with Verified Owner Lock**
  - *Chosen Approach*: Store public profile, social links, and gallery items in publicly readable Firestore collections while locking all write operations exclusively to the verified owner (`lakwinj1@gmail.com` / initialized owner UID).
  - *Why*: Anyone clicking your link from Instagram, WhatsApp, or a QR scan can view your page immediately with zero sign-in friction, while nobody else can tamper with your content.
  - *Alternatives Considered*: Requiring visitors to log in (rejected—breaks Link-in-Bio usability) or browser-only `localStorage` (rejected—changes wouldn't appear on other people's devices).

- **Decision 2: Strict Privacy Isolation for Visitor Contact Messages**
  - *Chosen Approach*: Visitor messages submitted through the Direct Contact Form are written to a dedicated `messages` collection where public visitors have **create-only** permission (with strict schema and length validation) and **zero read access**; only the verified site owner can read or delete messages.
  - *Why*: Protects visitor emails, phone numbers, and private inquiry text from ever being exposed publicly while delivering a real, persistent inbox right inside your website.
  - *Alternatives Considered*: `mailto:`-only links (often fail when visitors don't have a default mail app configured).

- **Decision 3: Client-Side QR Matrix & Standard `.vcf` vCard Generation**
  - *Chosen Approach*: Generate crisp SVG QR codes for your live URL and standards-compliant vCard 3.0 (`.vcf`) files directly in the browser from your saved profile fields.
  - *Why*: Works instantaneously offline or online, automatically updates whenever you edit your phone number, email, or name, and imports cleanly into iOS and Android contacts.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Top Navigation Bar (3-Zone)                          │
│     [ Owner Wordmark ]  ────  [ About · Links · Gallery · Contact ]          │
│                                                  ────  [ Share & QR Modal ]  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
┌─────────────────────────────────────────┐   ┌────────────────────────────────┐
│       Public Visitor Experience         │   │   Authenticated Owner Studio   │
│  ┌───────────────────────────────────┐  │   │      (Google Sign-In Gate)     │
│  │ Split Hero: Bio, Portrait,        │  │   │  ┌──────────────────────────┐  │
│  │ Save Contact (.vcf) & Quick Reach │  │   │  │ Profile & Bio Editor     │  │
│  ├───────────────────────────────────┤  │   │  ├──────────────────────────┤  │
│  │ Social & Channel Links Grid       │  │   │  │ Social Links CRUD & Sort │  │
│  ├───────────────────────────────────┤  │   │  ├──────────────────────────┤  │
│  │ Bento Gallery + Category Filter   │  │   │  │ Gallery Item Curator     │  │
│  │ + Fullscreen Lightbox Viewer      │  │   │  ├──────────────────────────┤  │
│  ├───────────────────────────────────┤  │   │  │ Private Messages Inbox   │  │
│  │ Direct Contact Form + Coordinates │  │   │  │ (Read / Reply / Delete)  │  │
│  └─────────────────┬─────────────────┘  │   └──────────────┬─────────────────┘
└────────────────────┼────────────────────┘                  │
                     │ Real-time Reads                       │ Verified Owner
                     │ & Validated Form Create               │ Mutations & Reads
                     ▼                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Firebase Cloud Backend (Firestore + Auth)                │
│  • /profiles/main        (Public Read · Verified Owner Create/Update)        │
│  • /socialLinks/{linkId} (Public Read · Verified Owner Create/Update/Delete) │
│  • /gallery/{itemId}     (Public Read · Verified Owner Create/Update/Delete) │
│  • /messages/{msgId}     (Validated Public Create · Verified Owner Read/Del) │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Profile (`profiles/main`)**: Holds `fullName`, `headline`, `bio`, `location`, `availabilityText`, `publicEmail`, `publicPhone`, `whatsappNumber`, `avatarUrl`, `heroImageUrl`, `ownerUid`, and `updatedAt` server timestamp. Seeded with polished default showcase content on first boot until personalized by the owner.
  - **Social Link (`socialLinks/{linkId}`)**: Holds `platform` (e.g., Instagram, WhatsApp, LinkedIn, Facebook, YouTube, X, GitHub, TikTok, Website), `label`, `handle`, `url`, `sortOrder`, `visible`, `ownerUid`, and `createdAt`/`updatedAt`.
  - **Gallery Item (`gallery/{itemId}`)**: Holds `title`, `category` (e.g., Photography, Design, Projects, Moments), `year`, `description`, `imageUrl`, `externalUrl`, `featured` (controls Bento `2x2` spotlight span), `sortOrder`, `ownerUid`, and `createdAt`/`updatedAt`.
  - **Contact Message (`messages/{msgId}`)**: Isolated private collection holding `senderName`, `senderEmail`, `senderPhone` (optional), `subject`, `message`, `isRead`, and `createdAt` server timestamp.

- **Interactive Component & State Mapping**:
  - **Share & QR Modal + Save Contact**: Clicking *Save Contact* synthesizes a `text/vcard` blob from live profile state and triggers an immediate `.vcf` download; clicking *Share / QR* opens a clean modal rendering a scannable SVG QR code of `window.location.href` with *Copy Link* and *Download QR PNG* actions.
  - **Gallery Filter & Lightbox**: Category segmented buttons filter the Bento grid client-side with zero latency; clicking any artwork opens a high-contrast Lightbox modal with keyboard (`Escape`, `ArrowLeft`, `ArrowRight`) navigation.
  - **Direct Contact Form**: Enforces client-side field length/email format checks matching Firestore security rules before submitting `addDoc` with `serverTimestamp()`, transitioning through `idle -> submitting -> success` states with reset capability.
  - **Owner Studio Drawer**: Accessible via Google `signInWithPopup`. Synchronizes form state with live Firestore snapshots, validates URL formats and image payload boundaries (< 600KB compressed data URL or valid HTTPS URL) prior to saving, and displays unread message counts in the Inbox tab.
