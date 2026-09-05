# Frontend UI 6 (Memory)

## Implementations Completed

### 1. Main Timeline Editor: Idle Prompts (T6.1)
- **Component**: `frontend/src/app/page.tsx`
- **Logic**: Implemented a timer-based hook (`isIdle`) that tracks when the main editor is empty. After 5 seconds of inactivity with an empty editor, it begins rotating through an array of `IDLE_PROMPTS` every 3 seconds to inspire the user.
- **Tests**: `Suite 11` in `page.test.tsx` validates the timer rotation and resets upon user input.

### 2. Main Timeline Editor: Attachment Controls (T6.2)
- **Component**: `frontend/src/app/page.tsx`
- **Logic**: Implemented a mock `handleUpload` function simulating `apiClient` requests to get a signed URL and confirm the upload. Displays Voice, Photo, and Location chips below the editor when attachments are added. Includes a pulsing "Uploading..." state and an error state if the upload fails.
- **Tests**: `Suite 10` in `page.test.tsx` validates the chip rendering and error handling.

### 3. Main Timeline Editor: Auto-Summary Trigger (T6.3)
- **Component**: `frontend/src/app/page.tsx`
- **Logic**: Implemented `handleBlur` on the main textarea. If `editorText.length > 5`, it fires a silent `apiClient` POST request to `/api/entries/123/summary/generate` to trigger the backend summarization routine in the background.
- **Tests**: `Suite 12` in `page.test.tsx` tracks that the `apiClient` is called with the correct payload on `onBlur`.

### 4. Chat Companion: Draft Extraction UI (T6.4)
- **Component**: `frontend/src/app/chat/page.tsx`
- **Logic**: Fully integrated `apiClient` to point to `/api/chat/message`. Replaced hardcoded dummy states with real loading indicators (typing dots) and disabled states. If the API response contains `extractedDraft`, the UI appends a "Drafted Journal Note" card below the AI response. The card allows the user to review the drafted note, edit it, and select a destination (append or new).
- **Tests**: `Suite 9` in `chat/page.test.tsx` was overhauled to intercept real `global.fetch` calls (via `apiClient`), ensuring the loading indicators work and the draft card renders properly.

## Integration Notes
- `apiClient` automatically injects the Firebase Auth JWT. During testing, it was discovered that the global `firebase/auth` mock in `jest.setup.ts` lacked a mocked `getIdToken` method, which caused `apiClient` calls to silently fail. This has been resolved globally.
