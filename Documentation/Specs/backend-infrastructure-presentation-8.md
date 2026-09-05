# Backend Infrastructure & Presentation — Task 8

**Date:** 2026-09-05
**Scope:** Implementing Core Integrations (Storage, Conversational AI, Summarization)
**Target:** `src/common/infrastructure/`, `src/entries/presentation/`, `src/chat/presentation/`

## Overview
This task builds upon the pure domain logic and interface contracts established in [`Documentation/Specs/Memory/business-logic-layer-5.md`](../Memory/business-logic-layer-5.md). Because the business layer defines the interfaces, this lower layer must now be updated to fulfill those contracts. The objective is to wire up the actual concrete infrastructure providers (Firebase Storage, Google Gemini SDK) and expose the required HTTP REST controllers so the frontend can interact with these new features.

---

## 1. AI Auto-Summary Integration

**Context:** The frontend needs to trigger the generation of a 1-line gist for an entry. The `GeminiAIProvider` needs the concrete implementation to talk to the Google GenAI SDK.

### Infrastructure Updates
- **`src/common/infrastructure/providers/gemini-ai.provider.ts`**:
  - Implement the `generateSummary(text: string): Promise<string>` method.
  - **Implementation Detail:** Call `gemini-1.5-flash` with a strict system prompt: `"You are a journaling assistant. Read the following text and provide a very short, 1-line gist summary. Return only the summary text without quotes."`

### Presentation (Controller) Updates
- **`src/entries/presentation/controllers/entries.controller.ts`**:
  - Add endpoint: `POST /entries/:id/summary/generate`
  - Retrieve `req.user.uid` from `FirebaseAuthGuard`.
  - Delegate to `EntryService.generateAndSaveSummary(uid, id)`.
  - Return `{ success: true }`.

### Required Unit Tests
- `gemini-ai.provider.spec.ts`: Mock `GoogleGenAI` and verify `generateSummary` correctly parses and returns the text response.
- `entries.controller.spec.ts`: Verify `POST /entries/:id/summary/generate` securely passes the `uid` and `entryId` to `EntryService`.

---

## 2. Conversational Chat Integration (Gemini ADK)

**Context:** The `ChatService` requires actual responses and drafted journal entries extracted from the conversational context.

### Infrastructure Updates
- **`src/common/infrastructure/providers/gemini-ai.provider.ts`**:
  - Implement `processChatTurn(history: ChatMessage[], newText: string, contextEntries: Entry[])`.
  - **Implementation Detail:**
    - Format `contextEntries` into a contextual RAG string.
    - Append the `history` as conversational turns.
    - Enforce a structured output (JSON schema) from Gemini: `{ replyText: string, extractedDraft: string | null }`.
    - Return the mapped object to the domain service.

### Required Unit Tests
- `gemini-ai.provider.spec.ts`: Mock a JSON-formatted response from Gemini and verify that `processChatTurn` successfully deserializes it into the `{ replyText, extractedDraft }` tuple.

---

## 3. Entry Attachments (Storage & Endpoints)

**Context:** Users can upload voice memos and photos. To avoid passing heavy binary data through the Node backend, the backend will issue presigned upload URLs (direct-to-GCS/Firebase), and then save the resulting metadata to the entry.

### Infrastructure Updates
- **`src/common/interfaces/storage-provider.interface.ts`**:
  - Create interface `StorageProvider` with method: `generateUploadUrl(uid: string, contentType: string, extension: string): Promise<{ uploadUrl: string, publicUrl: string }>`.
- **`src/common/infrastructure/providers/firebase-storage.provider.ts`**:
  - Implement `StorageProvider` using `firebase-admin/storage`. Generate a V4 signed URL targeting `users/{uid}/attachments/{uuid}.{extension}`.

### Presentation (Controller) Updates
- **`src/entries/presentation/dto/create-attachment.dto.ts`**:
  - Create DTO validating `type` ('voice', 'photo', 'location'), `url` (optional for location), `lat`/`lng` (optional), etc.
- **`src/entries/presentation/controllers/entries.controller.ts`**:
  - Add endpoint: `POST /entries/attachments/upload-url` (expects `{ contentType, extension }` in body, returns signed URL and public URL).
  - Add endpoint: `POST /entries/:id/attachments` (accepts `CreateAttachmentDto`, calls `EntryService.addAttachment(uid, id, dto)`).
  - Add endpoint: `DELETE /entries/:id/attachments/:attachmentId` (calls `EntryService.removeAttachment(uid, id, attachmentId)`).

### Required Unit Tests
- `firebase-storage.provider.spec.ts`: Verify that `getSignedUrl` is called on the Firebase Storage bucket with correct write permissions and expiration (e.g., 15 minutes).
- `entries.controller.spec.ts`: Verify that attachment endpoints correctly pipe data to `EntryService` and enforce `FirebaseAuthGuard`.

---

## Technical Constraints for the Agent
1. **Module Wiring:** Ensure `FirebaseStorageProvider` is registered and exported from `CommonModule` so it can be injected.
2. **DTO Validation:** Ensure all new body payloads are protected by NestJS `ValidationPipe` using `class-validator` decorators.
3. **Guard Usage:** All new routes must be wrapped with `@UseGuards(FirebaseAuthGuard)`.
