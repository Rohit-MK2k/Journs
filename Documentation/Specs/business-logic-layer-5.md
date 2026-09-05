# Business Logic Layer — Task 5

**Date:** 2026-09-05
**Scope:** Finalizing Core Domain Features (Attachments, Conversational AI, Auto-Summary)
**Target:** `src/entries/` and `src/chat/` and `src/common/`

## Overview
This task completes the missing business logic requirements defined in the project scope. The objective is to establish the pure domain logic, provider contracts, and service methods to handle entry attachments, conversational chat integration, and AI auto-summarization, all while remaining completely framework and database agnostic.

---

## 1. Auto-Summary Generation

**Context:** The timeline requires a 1-line gist of each entry. Generating this on every autosave keystroke is expensive. The backend must provide a service method to generate and store this asynchronously or when explicitly triggered.

### Interface & Domain Updates
- **`src/common/interfaces/ai-provider.interface.ts`**:
  - Add method: `generateSummary(text: string): Promise<string>`
- **`src/entries/domain/entry.ts`**:
  - Ensure `Entry` interface includes `summary?: string;`

### Service Updates
- **`src/entries/services/entry.service.ts`**:
  - Implement `generateAndSaveSummary(uid: string, entryId: string): Promise<void>`.
  - Flow:
    1. Retrieve the entry via `EntryRepository.findById()`.
    2. Throw a `NotFoundError` if the entry does not exist or doesn't belong to the `uid`.
    3. If `entry.text` is empty or too short (e.g., < 10 characters), skip generation and return.
    4. Call `AIProvider.generateSummary(entry.text)`.
    5. Update the entry with the new summary via `EntryRepository.update(uid, entryId, { summary })`.

### Required Unit Tests (`entry.service.spec.ts`)
- `should generate and save a summary for a valid entry` (Mocks `AIProvider.generateSummary` and verifies `EntryRepository.update` is called with the generated string).
- `should not generate a summary if the entry text is empty or too short` (Verifies `AIProvider` is not called).
- `should throw an error if the entry does not exist or belongs to another user`.

---

## 2. AI Chat Companion (Conversational Flow)

**Context:** The frontend UI currently uses mock chat data. The `ChatService` must be wired to request actual conversational responses from the AI, including background journal draft extraction.

### Interface & Domain Updates
- **`src/common/interfaces/ai-provider.interface.ts`**:
  - Add method: `processChatTurn(history: ChatMessage[], newText: string, contextEntries: Entry[]): Promise<{ replyText: string; extractedDraft?: string }>`

### Service Updates
- **`src/chat/services/chat.service.ts`**:
  - Update `sendMessage(uid: string, sessionId: string, text: string)` (or similar existing method):
    1. Retrieve `ChatSession` and user's recent `Entry` context.
    2. Call `AIProvider.processChatTurn()`, passing the session's message history and the user's entries context.
    3. Push the new user message and the AI's `replyText` to the `ChatSession` history.
    4. If the AI returns an `extractedDraft`, formulate an `EntryDraft` object (pending confirmation).
    5. Return the updated `ChatResponse` to the presentation layer.

### Required Unit Tests (`chat.service.spec.ts`)
- `should process a chat turn and append the AI reply to the session history`.
- `should correctly attach an EntryDraft to the response if the AI extracts one from the conversation`.
- `should retrieve recent entries and pass them to the AIProvider as context`.

---

## 3. Entry Attachments (Voice, Photo, Location)

**Context:** The frontend needs a way to associate media and location data with an entry. The actual binary upload (signed URLs) is handled by the presentation/infrastructure layers, but the domain must handle associating the resulting metadata.

### Interface & Domain Updates
- **`src/entries/domain/attachment.ts`**:
  - Ensure the `Attachment` value object is strictly typed for `voice` (URL/duration), `photo` (URL/dimensions), and `location` (lat/lng/label).

### Service Updates
- **`src/entries/services/entry.service.ts`**:
  - Implement `addAttachment(uid: string, entryId: string, attachment: Omit<Attachment, 'id'>): Promise<Attachment>`.
  - Flow:
    1. Retrieve the entry.
    2. Throw a `NotFoundError` if it doesn't exist/belong to the user.
    3. Generate a unique ID for the attachment.
    4. Append the attachment to the entry's `attachments` array.
    5. Save via `EntryRepository.update()`.
  - Implement `removeAttachment(uid: string, entryId: string, attachmentId: string): Promise<void>`.
    1. Retrieve the entry, filter out the `attachmentId`, and update the repository.

### Required Unit Tests (`entry.service.spec.ts`)
- `should successfully add a valid Voice attachment to an existing entry`.
- `should successfully add a valid Location attachment to an existing entry`.
- `should throw an error when attempting to add an attachment to an unauthorized or non-existent entry`.
- `should successfully remove an attachment by its ID`.

---

## Technical Constraints for the Agent
1. **No External SDKs:** Do not import `firebase-admin`, `@google/generative-ai`, or `@nestjs/common` in the domain or service files. Rely strictly on the interfaces.
2. **Pure Logic:** Do not handle HTTP requests, headers, or binary streams. Expect strings and metadata objects only.
3. **SOLID Principles:** Keep changes strictly additive and isolated. Ensure DIP is respected.
