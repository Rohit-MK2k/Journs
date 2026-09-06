# Bug Report

## 1. Authentication / AuthGuard Bug
`AuthGuard.tsx` evaluates `auth.currentUser` synchronously on component mount instead of using `auth.onAuthStateChanged`. Because Firebase session restoration is asynchronous, `auth.currentUser` is null on initial page load, which immediately redirects even authenticated users to `/login` upon a page refresh.

## 2. File Upload / Missing Body Error
In `frontend/src/app/page.tsx`, `handleUpload` triggers a `POST` to `/api/entries/attachments/upload-url` but passes no body. The backend (`EntriesController.generateUploadUrl`) explicitly requires `contentType` and `extension` in the request body. Because these fields are missing, the attachment upload process fails.

## 3. Timeline Render Crash (API Mismatch)
In `frontend/src/app/page.tsx`, the `JournalEntry` type expects specific fields: `relativeDate`, `aiSummary`, and `attachments` (as an object). However, the backend (`EntryService.getTimeline`) returns a different data structure: `date`, `preview`, and `hasAttachments` (as a boolean). When the frontend tries to render the timeline, evaluating `entry.attachments.voice` throws a `TypeError: Cannot read properties of undefined` and crashes the UI.

## 4. Chat Parsing Mismatch (SSE stream)
In `ChatController.sendMessage`, the backend streams data chunks with the structure `{ message, draft }`. Meanwhile, the frontend `chat/page.tsx` parses the data looking for `data.replyText` and `data.extractedDraft`. Because of this key mismatch, the frontend never registers or displays the AI's chat replies.

## 5. Search Results Crash (Array vs Object Mismatch)
In `search/page.tsx`, `executeSearch` does `setResults(data)` expecting an array. However, `SearchController.semanticSearch` returns an object: `{ matches: [...] }`. Treating this object as an array causes the frontend to throw a `results.map is not a function` error when attempting to render the search results.
