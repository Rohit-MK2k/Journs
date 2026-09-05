# Frontend UI Layer — Task 6

**Date:** 2026-09-05
**Scope:** Finalizing Core UX and Chat Integration
**Target:** `frontend/src/app/page.tsx` and `frontend/src/app/chat/page.tsx`

## Overview
This task concludes the visual and interactive requirements for the Next.js frontend application. The objective is to build the missing UI components for attachments and idle prompting, and to strip out the mock data in the chat interface so it can be wired directly to the real backend APIs. 

---

## 1. Core UI: Entry Attachments (Voice, Photo, Location)

**Context:** The user must be able to attach rich media to their daily text entry without leaving the main dashboard.

### Component Updates (`src/app/page.tsx`)
- **Attachment Controls:** Add a minimal, distraction-free control bar below the main `<textarea>`. It should include icons for Voice (microphone), Photo (camera/gallery), and Location (map pin).
- **Upload Flow Implementation:**
  1. User clicks an attachment icon and selects a file or grants location permission.
  2. The frontend calls the backend to get a signed upload URL (`POST /api/entries/attachments/upload-url`).
  3. The frontend uploads the binary data directly to the cloud storage bucket via the signed URL.
  4. The frontend saves the attachment metadata to the entry (`POST /api/entries/:id/attachments`).
- **Visual Feedback:** Display a small uploading spinner, followed by a chip/tag indicating the attachment has been successfully added to the entry.

### Required Test Cases (React Testing Library)
- `should render the attachment control icons below the editor`.
- `should successfully simulate an attachment upload flow and render the resulting metadata chip`.
- `should display an error state if the signed URL request or cloud upload fails`.

---

## 2. Core UI: AI on Write (Idle Prompt)

**Context:** To overcome "blank page syndrome," the editor should gently prompt the user if they pause without typing anything.

### Component Updates (`src/app/page.tsx`)
- **Idle Hook:** Implement a custom hook (e.g., `useIdlePrompt`) that tracks the user's typing.
- **Behavior:** If the `<textarea>` is completely empty and the user has not typed anything for 5 seconds, swap the default `placeholder` text with a rotating, static string (e.g., "What's on your mind today?", "How are you feeling?", "Write about a small win.").
- **Constraints:** This must be strictly client-side text (no AI network calls) to keep it fast and free.

### Required Test Cases
- `should display standard placeholder on initial mount`.
- `should display a rotating idle prompt after 5 seconds of inactivity when the input is empty`.
- `should immediately clear the idle prompt and stop rotating once the user types a character`.

---

## 3. Core UI: Auto-Summary Trigger

**Context:** The timeline requires a 1-line gist of each entry. The frontend must tell the backend when to generate it.

### Component Updates (`src/app/page.tsx`)
- **Trigger Logic:** Attach an `onBlur` event handler to the main editor (or a listener for when the user navigates away or closes the app). 
- **Behavior:** If the text has significantly changed, fire a background request to `POST /api/entries/:id/summary/generate`. Do not block the UI or show a loading spinner for this background task.

### Required Test Cases
- `should trigger the summary generation API endpoint silently in the background on editor blur`.

---

## 4. Chat UI: Conversational API Wiring

**Context:** The chat companion currently relies on mock data. It must be hooked up to the real API.

### Component Updates (`src/app/chat/page.tsx`)
- **Remove Mock Data:** Delete the hardcoded chat history array.
- **API Wiring:** 
  - Wire the "Send" button to push the user's message to the backend (`POST /api/chat/message`).
  - Maintain a loading state (e.g., typing indicator) while waiting for the response.
  - Append the actual AI `replyText` to the local chat stream.
- **Draft Extraction State:** If the backend response includes an `extractedDraft`, render the Drafted Journal Note Card UI, allowing the user to explicitly confirm or edit it before it saves to the journal.

### Required Test Cases
- `should disable the send button and show a typing indicator while awaiting the AI API response`.
- `should append the user message and real AI response to the chat view upon a successful API call`.
- `should render the Draft Confirmation Card if the API returns an extractedDraft string`.

---

## Testing Requirements
- All components must be thoroughly tested using **Jest** and **React Testing Library**.
- Utilize `msw` (Mock Service Worker) or Jest mocks to intercept and simulate backend API responses for the upload URLs, summary generation, and chat endpoints.
- Ensure all interactive states (idle timers, loading spinners, draft confirmation clicks) are covered by explicit assertions.
