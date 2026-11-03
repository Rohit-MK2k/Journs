# Parallel Monorepo Migration Phase 5 (Part 2) — Spec Memory

- **Spec Document:** `Documentation/Specs/parallel-monorepo-migration-phase5-002.md`
- **Target:** `packages/chat/src/`, `packages/chat/dist/`, `packages/cron/src/`, `packages/cron/dist/`
- **Date:** 2026-11-03
- **Status:** Implemented

---

## 1. Summary of Steps Taken

1. **`@journ/chat` Domain Models (`REQ-1`):**
   - Created `packages/chat/src/domain/chat-message-mode.ts` defining `ChatMessageMode` (`'text' | 'voice'`).
   - Created `packages/chat/src/domain/entry-draft.ts` defining `EntryDraft`.
   - Created `packages/chat/src/domain/chat-response.ts` defining `ChatResponse`.
   - Created `packages/chat/src/domain/draft-save-target.ts` defining `DraftSaveTarget`.
   - Created `packages/chat/src/domain/chat-session.ts` defining `ChatMessage` and `ChatSession` consuming `HabitMemory` from `@journ/habit-memory`.
   - Created `packages/chat/src/domain/index.ts` re-exporting all domain symbols.

2. **`@journ/chat` Domain Service Implementation (`REQ-2`):**
   - Created `packages/chat/src/services/chat.service.ts` implementing `ChatService` with session lifecycle, rolling 7-day recent entry retrieval via `EntryRepository`, multi-turn conversational AI interaction via `AIProvider`, context draft extraction, and confirmed draft entry saving.
   - Created `packages/chat/src/services/index.ts`.
   - Verified via `npm test -w @journ/chat packages/chat/test/services` (1 suite, 22/22 tests passed).

3. **`@journ/chat` Presentation Controllers & DTOs (`REQ-3`):**
   - Created `packages/chat/src/presentation/dto/send-message.dto.ts` with `class-validator` rules.
   - Created `packages/chat/src/presentation/dto/confirm-draft.dto.ts` with nested validation and transformation rules.
   - Created `packages/chat/src/presentation/controllers/chat.controller.ts` with session initiation, SSE streaming response, and draft confirmation endpoints.
   - Created barrel files in `dto/`, `controllers/`, and `presentation/index.ts`.
   - Verified via `npm test -w @journ/chat packages/chat/test/presentation` (3 suites, 8/8 tests passed).

4. **`@journ/chat` NestJS Module & Public API Wiring (`REQ-4`):**
   - Created `packages/chat/src/chat.module.ts` registering `ChatController`, `ChatService` factory provider, and importing `EntriesModule` and `HabitMemoryModule`.
   - Created `packages/chat/src/index.ts` exporting public package symbols.
   - Verified via `npm test -w @journ/chat packages/chat/test/chat.module.spec.ts` (1 suite, 1/1 test passed).

5. **`@journ/cron` Presentation Webhook Controller (`REQ-5`):**
   - Created `packages/cron/src/presentation/controllers/cron.controller.ts` implementing `CronController` with `@Public()` endpoints for `POST /cron/habit-memory`, `POST /cron/attachment-cleanup`, and `POST /cron/all` protected by `verifySecret`.
   - Created barrel files in `controllers/` and `presentation/index.ts`.
   - Verified via `npm test -w @journ/cron packages/cron/test/presentation` (1 suite, 5/5 tests passed).

6. **`@journ/cron` NestJS Module & Public API Wiring (`REQ-6`):**
   - Created `packages/cron/src/cron.module.ts` registering `CronController` and importing `HabitMemoryModule` and `EntriesModule`.
   - Created `packages/cron/src/index.ts` exporting public package symbols.
   - Added `packages/cron/test/setup.ts` and configured `setupFiles` in `packages/cron/jest.config.js` to isolate Firebase Admin singletons during container compilation.
   - Verified via `npm test -w @journ/cron packages/cron/test/cron.module.spec.ts` (1 suite, 1/1 test passed).

7. **Independent Package Build & Test Execution (`REQ-7`):**
   - Executed `npm run build -w @journ/chat` producing clean `.js`, `.d.ts`, and `.map` files in `packages/chat/dist/` with 0 errors.
   - Executed `npm run build -w @journ/cron` producing clean `.js`, `.d.ts`, and `.map` files in `packages/cron/dist/` with 0 errors.
   - Executed `npm test -w @journ/chat` (5 suites, 31 tests passed).
   - Executed `npm test -w @journ/cron` (2 suites, 6 tests passed).
   - Executed `npm test --workspaces` verifying all 6 workspace packages (37 test suites, 181 tests passed).

8. **Monolith Non-Interference Verification (`REQ-8`):**
   - Checked `git status -s` confirming zero modifications in `src/` or `frontend/`.
   - Executed root `npm test` verifying all 32 legacy test suites (172/172 tests passed).

---

## 2. Decisions & Rationale

- **Contract Translation in `ChatService`:** `packages/common/src/interfaces/contracts.ts` declares `IChatMessage` (`role: 'user' | 'assistant' | 'model'`, `content: string`) and `IEntryDraft` (`text: string`). `ChatService` maps internal `ChatMessage` (`role: 'user' | 'ai'`, `text: string`) into the expected `IChatMessage` payload when dispatching `processChatTurn`, ensuring strict compatibility without introducing peer package coupling.
- **Global Jest Setup for Cron:** `packages/cron/test/cron.module.spec.ts` imports `CommonModule`, which loads `FirebaseAuthGuard`. Introducing `packages/cron/test/setup.ts` to mock Firebase Admin Auth/Firestore globally resolved Jest ESM parsing errors from upstream Firebase dependencies.
- **Module Exports in `CronModule`:** NestJS modules cannot export controllers in `exports: [...]` (only providers and imported modules). `CronController` remains correctly registered under `controllers: [CronController]` without an invalid export declaration.

---

## 3. Deviations from the Spec

- `packages/cron/jest.config.js` and `packages/cron/test/setup.ts` were added to supply global mocks for Firebase Admin during `cron.module.spec.ts` execution, matching the established setup configuration in `@journ/chat`, `@journ/habit-memory`, and `@journ/entries`.

---

## 4. Verification Evidence

1. **Independent Builds:**
   - `npm run build -w @journ/chat` exited code 0 (`tsc`).
   - `npm run build -w @journ/cron` exited code 0 (`tsc`).
2. **Package Tests:**
   - `npm test -w @journ/chat`: 5 suites passed, 31 tests passed.
   - `npm test -w @journ/cron`: 2 suites passed, 6 tests passed.
3. **Workspace Full Suite:**
   - `npm test --workspaces`: 37 suites passed, 181 tests passed across `@journ/account`, `@journ/chat`, `@journ/common`, `@journ/cron`, `@journ/entries`, and `@journ/habit-memory`.
4. **Monolith Non-Interference:**
   - `git status -s`: Zero modifications in `src/` or `frontend/`.
   - `npm test`: 32 suites passed, 172 tests passed.

---

## 5. Failures & Dead Ends

- Initial compilation of `packages/chat/src/services/chat.service.ts` failed due to type mismatch between `ChatMessage` and `@journ/common` contract `IChatMessage`. Resolved by mapping the payload in `ChatService.sendMessage` and safely translating `IEntryDraft` properties in `draftEntryFromContext`.
- Initial execution of `packages/cron/test/cron.module.spec.ts` failed due to `CronController` being incorrectly placed in the `exports` array of `CronModule`, as well as unmocked `firebase-admin/auth` loading `jose` ESM syntax. Resolved by removing the invalid controller export and adding `packages/cron/test/setup.ts`.

---

## 6. Known Issues & Follow-ups

- With Phase 5 fully implemented, all domain logic has been extracted from `src/` into `packages/*`. The workspace is ready for Phase 6: Incremental Composition Root Setup (`apps/backend`).
