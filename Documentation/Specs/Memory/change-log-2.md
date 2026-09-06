# Change Log 2 - Spec Memory

**Date:** 2026-09-06  
**Log ID:** `change-log-2`  
**Scope:** Native Firestore cosine vector search, Gemini Embedding-2 integration, Firestore repository undefined serialization fix, polymorphic attachment DTO validation, frontend auth readiness hydration, deep-linking from search results, real auth identity in settings, and zero-flash app-wide theme persistence in localStorage.

---

## 1. Summary of Commits

| Commit Hash | Type / Scope | Description |
|-------------|--------------|-------------|
| `c412aa7` | `feat(vector-search)` | Add Firestore cosine vector search and Gemini embedding-2 support |
| `f52b7ac` | `feat(entries)` | Sanitize undefined values in Firestore repo and add polymorphic attachment DTOs |
| `d3f22c0` | `feat(frontend)` | Add auth readiness check and deep-linking to entries from semantic search |
| `67a29cd` | `feat(settings)` | Connect real auth user profile and implement app-wide theme persistence |

---

## 2. Core Architectural & Code Changes

### 2.1 Native Firestore Cosine Vector Search & Gemini Embedding-2 (src/entries/, src/common/)
- **Firestore Vector Search Provider:** Implemented `FirestoreCosineVectorSearchProvider` conforming to `VectorSearchProvider`. Uses native Firestore `findNearest` vector queries (`FieldValue.vector(values)`) with `COSINE` distance measure, enabling vector indexing directly inside Firestore without mandatory external vector databases.
- **Gemini Embeddings:** Standardized embedding model calls to `gemini-embedding-2` with `outputDimensionality: 768`.
- **Thinking Budget Optimization:** Set `thinkingBudget: 0` in `GeminiAIProvider` for deterministic JSON extraction and fast entry summarization.
- **Search Enrichment & Backfill:** Enhanced `SemanticSearchService` to fetch full entry models, backfill missing summaries on-the-fly, calculate normalized cosine similarity match scores (`0-100%`), and extract dynamic query semantic chips.
- **Reindexing Utility:** Added `scripts/reindex-entries.ts` script for generating embeddings and backfilling existing entries.

### 2.2 Entry Domain, DTOs & Firestore Repository Sanitization (src/entries/)
- **Undefined Sanitization:** Added `removeUndefined` helper in `FirestoreEntryRepository` to recursively strip `undefined` fields, resolving Firestore's `Function DocumentReference.set() cannot be called with an undefined value` runtime exceptions.
- **Polymorphic Attachment DTOs:** Replaced generic attachment validation in `CreateEntryDto` with discriminated union DTOs (`AttachmentPhotoDto`, `AttachmentVoiceDto`, `AttachmentLocationDto`) using `class-transformer` discriminator mapping.
- **Domain Model:** Extended `Entry` interface with optional `embedding: number[]` property for Firestore vector storage.

### 2.3 Frontend Auth Readiness & API Client Resilience (`frontend/src/lib/`)
- **Auth State Hydration:** Updated `apiClient.ts` to await `auth.authStateReady()` before resolving `auth.currentUser`. Prevents false positive 401/Unauthorized errors on page refreshes before Firebase client SDK finishes token hydration.
- **Unit Test Coverage:** Added test in `apiClient.test.ts` verifying that `authStateReady` is awaited before requests fire.

### 2.4 Deep-Linking & Semantic Search Navigation (`frontend/src/app/`)
- **Deep-Linking:** Extended `frontend/src/app/page.tsx` to read `?entry=<id>` search parameter on load, automatically fetching and displaying the selected entry from search.
- **Search Result Cards:** Refactored `frontend/src/app/search/page.tsx` to render all surfaced vector matches with match scores, AI summaries, snippet text, and media badges. Configured "Tap to read full entry" to navigate directly to the journal dashboard (`/?entry=<id>`).

### 2.5 Settings Profile & App-Wide Theme Persistence (`frontend/src/app/settings/`, `frontend/src/app/`)
- **Real User Identity:** Replaced hardcoded profile mock data ("Alex Chen", "AC", "alex.chen@gmail.com") in `settings/page.tsx` with live data from `auth.currentUser` and `onAuthStateChanged`, displaying OAuth profile avatars or calculated user initials.
- **Global Theme Persistence:** 
  - Added `.dark` selector and `@custom-variant dark` in `globals.css`.
  - Scoped system dark mode `@media (prefers-color-scheme: dark)` to `:root:not(.light)` so manual light selections override OS dark preferences.
  - Added a zero-flash bootstrap script in `frontend/src/app/layout.tsx` `<head>` to read `localStorage.getItem('theme')` before first paint.
  - Persisted user theme changes directly to `localStorage` and synchronized `.dark`/`.light` classes on `document.documentElement`.
  - Persisted `habitMemoryEnabled` preference to `localStorage` and sent patch updates to `/api/account/settings`.

---

## 3. Verification & Test Coverage

- **Backend:** 27/27 test suites passing (144 total unit and integration tests).
- **Frontend:** 7/7 test suites passing (36 total unit tests, including theme localStorage assertions and auth readiness checks).
- **Manual Verification:** Tested theme toggle persistence across reloads and routes, validated search result click-through to journal entries, and verified OAuth user profile rendering.
