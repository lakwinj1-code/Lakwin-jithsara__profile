# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Verified Site Owner Exclusivity**: Only the verified owner (`request.auth != null && request.auth.token.email_verified == true && request.auth.token.email == 'lakwinj1@gmail.com'`) can create, update, or delete `profiles/main`, `socialLinks/{linkId}`, and `gallery/{itemId}`, and `ownerUid` must equal `request.auth.uid` on creation and remain immutable on updates.
2. **Singleton Profile Enforcement**: Only document ID `'main'` is valid in `/profiles/{profileId}`; `list` queries on `/profiles` are completely denied.
3. **Scoped Public Visibility (Query Enforcer)**: Unauthenticated visitors can only read `profiles/main` when `isPublished == true` (or `resource == null` prior to initialization), `socialLinks` when `resource.data.visible == true`, and `gallery` when `resource.data.published == true`.
4. **Strict PII Isolation on Contact Messages**: Visitors can `create` documents in `/messages/{messageId}` with strict schema, regex email validation, `status == 'unread'`, `targetProfileId == 'main'`, and `createdAt == request.time`, but have ZERO `get`, `list`, `update`, or `delete` access. Only `isSiteOwner()` can read, update status, or delete messages.
5. **Terminal State Locking**: Once a `ContactMessage` reaches `status == 'archived'`, no further updates are permitted.
6. **Temporal & Structural Integrity**: Every entity strictly enforces `hasAll` + `hasOnly` key allowlists, explicit string `.size()` limits matching `firebase-blueprint.json`, `isValidId()` regex guards (`^[a-zA-Z0-9_\-]+$`), immutable `createdAt`, and server timestamp `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return `PERMISSION_DENIED`)
1. **Spoofed Unverified Owner Email**: `{ auth: { uid: 'attacker1', email: 'lakwinj1@gmail.com', email_verified: false } }` attempting `setDoc('/profiles/main', validProfile)` -> Denied (`email_verified == true` required).
2. **Shadow Field Injection on Profile**: Verified owner sends `validProfile` + `{ isSuperAdmin: true }` -> Denied (`hasOnly` rejects extra key).
3. **Owner UID Spoofing**: Verified owner creates `socialLinks/link1` with `ownerUid: 'other-uid'` -> Denied (`data.ownerUid == request.auth.uid` fails).
4. **Immutable Field Tampering**: Verified owner updates `gallery/item1` changing `createdAt` or `ownerUid` -> Denied (`incoming().createdAt == existing().createdAt` & `ownerUid` immutability).
5. **Public PII Scraping (Messages Get/List)**: Authenticated non-owner (`other@gmail.com`) calls `getDocs(collection(db, 'messages'))` or `getDoc(doc(db, 'messages', 'msg1'))` -> Denied (`isSiteOwner()` required).
6. **Unfiltered Public List Scraping on Hidden Social Links**: Anonymous user calls `getDocs(collection(db, 'socialLinks'))` without `where('visible', '==', true)` -> Denied (`resource.data.visible == true` required).
7. **Contact Message Pre-Marked Read/Archived**: Visitor creates `messages/msg1` with `status: 'archived'` -> Denied (`incoming().status == 'unread'` required on create).
8. **Terminal State Mutation**: Verified owner attempts `updateDoc('/messages/msg1', { status: 'read' })` when `existing().status == 'archived'` -> Denied (`existing().status != 'archived'` gate).
9. **ID Poisoning Attack**: Visitor creates `/messages/bad..id$%` or >128 char ID -> Denied (`isValidId(messageId)` fails).
10. **Denial-of-Wallet Oversized Payload**: Visitor sends `message` string of 50,000 chars to `/messages/msg1` -> Denied (`data.message.size() <= 2000` fails).
11. **Malformed Email Injection**: Visitor sends `senderEmail: 'not-an-email'` to `/messages/msg1` -> Denied (`matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')` fails).
12. **Client-Forged Timestamp**: Visitor sends `createdAt: Timestamp.fromMillis(1000000)` instead of `serverTimestamp()` -> Denied (`incoming().createdAt == request.time` fails).
