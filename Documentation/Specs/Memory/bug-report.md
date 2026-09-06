# Bug Report Fixes

This document records the fixes applied for the bugs originally outlined in `Documentation/Specs/bug-report.md`.

## 1. Authentication / AuthGuard Bug
**Issue:** `AuthGuard.tsx` synchronously evaluated `auth.currentUser` on mount instead of using `auth.onAuthStateChanged()`.
**Fix:** Updated `frontend/src/components/AuthGuard.tsx` to subscribe to `auth.onAuthStateChanged()` inside the `useEffect` hook. This ensures that the guard properly waits for Firebase's asynchronous auth state restoration before redirecting to `/login`.

## 2. File Upload / Missing Body Error
**Issue:** `handleUpload` in `frontend/src/app/page.tsx` was missing required body properties (`contentType` and `extension`) when calling `/api/entries/attachments/upload-url`.
**Fix:** Modified the `POST` request in `handleUpload` to provide `contentType` and `extension` in the JSON body, resolving the backend validation failure.

## 3. Timeline Render Crash (API Mismatch)
**Issue:** A mismatch between the backend `EntryService.getTimeline` returning `{ date, preview, wordCount, hasAttachments }` (as `EntrySummary[]`) and the frontend `JournalEntry` type expecting `{ relativeDate, aiSummary, attachments }`. This mismatch caused a runtime crash when evaluating `attachments.voice`.
**Fix:** 
- Aligned the frontend `JournalEntry` interface in `frontend/src/app/page.tsx` with the backend `EntrySummary` shape (`date`, `preview`, `wordCount`, `hasAttachments`).
- Updated the React rendering logic for both the expanded entry view and the timeline view to use these fields. Mapped UI presentation natively to `hasAttachments` instead of looking for specific attachment types in `attachments.voice`.

## 4. Chat Parsing Mismatch (SSE stream)
**Issue:** The frontend chat view expected chunks formatted with `replyText` and `extractedDraft`, whereas the backend provided `message` and `draft`.
**Fix:** Updated `frontend/src/app/chat/page.tsx` to correctly parse `data.message` and `data.draft` from the event stream. Replaced access to `data.replyText` and `data.extractedDraft` for both the streaming logic and the fallback REST API handling.

## 5. Search Results Crash (Array vs Object Mismatch)
**Issue:** `frontend/src/app/search/page.tsx` tried to map `results` directly from the response data, but the API returned an object wrapped in `{ matches: [...] }`.
**Fix:** Updated `executeSearch` to use `setResults(data.matches || [])`, ensuring `results` always receives an array.
