# Change Log 1 - Spec Memory

**Date:** 2026-09-06  
**Log ID:** `change-log-1`  
**Scope:** Authentication hydration, GCS signed URLs, pending attachment tracking, daily orphan cleanup cron, interactive media previews, and blob URL sanitization.  

---

## 1. Summary of Commits

| Commit Hash | Type / Scope | Description |
|-------------|--------------|-------------|
| `e82c8ad` | `docs(specs)` | Document bug reports and fixes |
| `ac48203` | `fix(auth)` | Handle async auth state restoration in AuthGuard |
| `16b2b00` | `fix(frontend)` | Align chat payload keys and search response parsing |
| `810bae7` | `feat(storage)` | Add signed read urls and upgrade gemini models |
| `dee4d39` | `feat(entries)` | Add pending attachments tracking and daily cleanup cron |
| `d7a53d1` | `feat(entries)` | Add single entry retrieval and pending attachment deletion |
| `1bd6f2e` | `fix(dashboard)` | Sanitize blob urls and add attachment viewers |

---

## 2. Core Architectural & Code Changes

### 2.1 Authentication Hydration (`frontend/src/components/AuthGuard.tsx`)
- **Issue:** Synchronous evaluation of `auth.currentUser` on mount caused premature redirects to `/login` during initial page load before Firebase hydrated user credentials.
- **Resolution:** Subscribed to `auth.onAuthStateChanged()` in `useEffect`, awaiting explicit Firebase state resolution before navigating.
- **Login Flow:** Updated `frontend/src/app/login/page.tsx` with redirect-based Google authentication.

### 2.2 Chat SSE Streaming & Search Unwrapping
- **Chat Stream Parsing:** Updated `frontend/src/app/chat/page.tsx` to parse `message` and `draft` fields from SSE events in addition to legacy `replyText` and `extractedDraft` keys.
- **Semantic Search Response Parsing:** Updated `frontend/src/app/search/page.tsx` `executeSearch` to unwrap `data.matches` when receiving `{ matches: [...] }`.

### 2.3 Cloud Storage Signed URLs (`src/common/`)
- **Interface & Provider:** Added `getSignedReadUrl(filePath)` and `deleteFile(filePath)` to `StorageProvider` interface.
- **Implementation:** Implemented `getSignedReadUrl` in `FirebaseStorageProvider` generating V4 read-signed URLs with 7-day expiration, eliminating 403 Forbidden errors for private Google Cloud Storage media files.
- **Upload URLs:** Updated `generateUploadUrl` to produce deterministic `fileId` and `filePath` metadata.

### 2.4 Orphan Attachment Tracking & Daily Cleanup Cron (`src/entries/`)
- **Domain & Repository:**
  - Added `PendingAttachment` domain entity (`id`, `uid`, `filePath`, `publicUrl`, `createdAt`).
  - Created `PendingAttachmentRepository` interface and `FirestorePendingAttachmentRepository` implementation.
- **Cleanup Cron:** Built `AttachmentCleanupCronService` scheduled daily at 02:00 (`0 2 * * *`) to delete orphaned files from Google Cloud Storage and remove pending records.
- **Lifecycle Cleanup:** Updated `EntryService` to record pending files during upload URL generation and delete pending records upon entry save or attachment addition.

### 2.5 Entry Endpoints & Attachment Deletion
- **GET `/entries/:id`:** Added single entry retrieval endpoint that generates fresh signed read URLs for all stored attachments on-the-fly.
- **DELETE `/entries/attachments/pending/:fileId`:** Added endpoint for immediate client-side cancellation and deletion of pending uploads.

### 2.6 Interactive Media Previews & Blob URL Sanitization (`frontend/src/app/page.tsx`)
- **Blob URL Persistence Bug:** Ephemeral `URL.createObjectURL` pointers stored in `localStorage` caused `ERR_FILE_NOT_FOUND` on page reload. Fixed by prioritizing permanent storage URLs (`att.url || att.previewUrl`), omitting `blob:` URLs during autosave, and stripping stale `blob:` URLs during draft hydration.
- **Interactive Lightbox:** Added photo thumbnails with interactive modal zoom lightbox (dismissible via Escape key and backdrop click).
- **Audio Player:** Embedded native `<audio controls>` player for voice recordings.
- **Location Mapping:** Linked coordinates directly to Google Maps navigation.

### 2.7 AI Models & Vector Search Upgrades
- Upgraded Gemini model identifiers to `gemini-3.6-flash` and `gemini-embedding-2`.
- Added graceful error handling in `VertexAIVectorSearchProvider` to prevent unhandled rejections during embedding failures.

---

## 3. Verification & Test Coverage

- Backend: 27/27 test suites passing (142 unit and integration tests).
- Frontend: 7/7 test suites passing (35 unit tests).
- Verified full upload, audio playback, reload persistence, and lightbox preview cycles.
