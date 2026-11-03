# Parallel Monorepo Migration Phase 5 (Part 2) — `@journ/chat` & `@journ/cron` Production Code Extraction
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-11-02

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 5 Part 1 (`Documentation/Specs/parallel-monorepo-migration-phase5-001.md`) established the package manifests, isolated Jest runner environments, and 7 staged test suites (37 test cases) across `packages/chat/test/` and `packages/cron/test/`.

The goal of Phase 5 Part 2 is to extract and implement the production code in `packages/chat/src/` and `packages/cron/src/` to satisfy all staged test suites, enable independent package compilation and testing, and complete the package extraction phase of the Parallel Monorepo Migration Plan.

Under the Strangler Fig pattern, the legacy monolith in `src/chat/` and `src/cron/` remains untouched and continues functioning without modification or regression.

### 1.2 Scope
- **In Scope:**
  - Extracting production domain models in `packages/chat/src/domain/`:
    - `chat-message-mode.ts`: `ChatMessageMode` union type (`'text' | 'voice'`).
    - `chat-response.ts`: `ChatResponse` interface.
    - `chat-session.ts`: `ChatMessage` and `ChatSession` interfaces.
    - `draft-save-target.ts`: `DraftSaveTarget` union type (`'today' | 'new'`).
    - `entry-draft.ts`: `EntryDraft` interface.
    - `index.ts`: barrel exports.
  - Extracting core business logic in `packages/chat/src/services/`:
    - `chat.service.ts`: `ChatService` managing in-memory active sessions, habit memory hydration, multi-turn AI chat turns with recent entry context, context draft extraction, and confirmed journal entry persistence.
    - `index.ts`: barrel export.
  - Extracting presentation controllers and DTOs in `packages/chat/src/presentation/`:
    - `controllers/chat.controller.ts`: `ChatController` exposing `POST /chat/session`, `POST /chat/message` (with streaming support), and `POST /chat/draft/confirm`.
    - `controllers/index.ts`: barrel export.
    - `dto/send-message.dto.ts`: `SendMessageDto` with `class-validator` decorators.
    - `dto/confirm-draft.dto.ts`: `ConfirmDraftDto` with `class-validator` and `class-transformer` decorators.
    - `dto/index.ts`: barrel export.
    - `index.ts`: barrel export.
  - Wiring `@journ/chat` NestJS module and public API:
    - `packages/chat/src/chat.module.ts`: `ChatModule` configuring `ChatController`, `ChatService` factory provider, and importing `EntriesModule` and `HabitMemoryModule`.
    - `packages/chat/src/index.ts`: public package entry point re-exporting domain, services, controllers, DTOs, and module.
  - Extracting presentation webhook controller in `packages/cron/src/presentation/`:
    - `controllers/cron.controller.ts`: `CronController` exposing `@Public()` HTTP POST webhook triggers (`/cron/habit-memory`, `/cron/attachment-cleanup`, `/cron/all`) with secret validation via `x-cron-secret`.
    - `controllers/index.ts`: barrel export.
    - `index.ts`: barrel export.
  - Wiring `@journ/cron` NestJS module and public API:
    - `packages/cron/src/cron.module.ts`: `CronModule` registering `CronController` and importing `HabitMemoryModule` and `EntriesModule`.
    - `packages/cron/src/index.ts`: public package entry point re-exporting controllers and module.
  - Independent package compilation (`npm run build -w @journ/chat` and `npm run build -w @journ/cron`) emitting clean `.js`, `.d.ts`, and `.map` files into `dist/` with zero TypeScript errors.
  - Independent package test execution (`npm test -w @journ/chat` and `npm test -w @journ/cron`) passing all staged test suites (37 test cases) with 100% pass rate.
  - Monolith non-interference verification (`npm test`).

- **Explicitly Out of Scope:**
  - Modifying or deleting any file within legacy `src/` or `frontend/`.
  - Modifying the staged test files in `packages/chat/test/` or `packages/cron/test/`.
  - Wiring the composition root in `apps/backend` (Phase 6) or final cutover (Phase 7).

### 1.3 Requirements
- **`REQ-1` Chat Domain Models & Value Types (`packages/chat/src/domain/`):**
  - `ChatMessageMode` must represent `'text' | 'voice'`.
  - `EntryDraft` must represent `{ text: string; sourceContext: string }`.
  - `ChatResponse` must represent `{ message: string; draft?: EntryDraft }`.
  - `ChatMessage` must represent `{ role: 'user' | 'ai'; text: string; timestamp: Date }`.
  - `ChatSession` must represent `{ id: string; uid: string; habitMemory?: HabitMemory; startedAt: Date; history?: ChatMessage[] }`.
  - `DraftSaveTarget` must represent `'today' | 'new'`.
  - Domain models must depend only on abstractions from `@journ/habit-memory` and `@journ/common`.

- **`REQ-2` Chat Service Business Logic (`packages/chat/src/services/chat.service.ts`):**
  - `ChatService` must inject `repo: EntryRepository`, `habitStore: HabitMemoryStore`, and `aiProvider: AIProvider`.
  - `startSession(uid)`:
    - Validates `uid` (throws `ValidationError` if empty or whitespace-only).
    - Retrieves `HabitMemory` from `habitStore.get(uid)`; falls back to default structure `{ uid, topics: [], frequency: 'unknown', tone: 'neutral', updatedAt: new Date() }` if not found.
    - Creates a new `ChatSession` with a UUID and stores it in internal in-memory map keyed by `uid`.
  - `sendMessage(uid, message, mode)`:
    - Validates `uid`, `message`, and `mode` (throws `ValidationError` on empty, whitespace, or invalid mode).
    - Checks for an active session in in-memory map (throws `ConflictError` if absent).
    - Queries recent entries within a 7-day lookback window (`Date.now() - 7 * 24 * 60 * 60 * 1000`) via `repo.listRecent(uid, since)`.
    - Invokes `aiProvider.processChatTurn(session.history, message, recentEntries)`.
    - Appends user and AI turns to `session.history`.
    - Returns `ChatResponse` with `draft` attached if extracted by the AI turn.
  - `draftEntryFromContext(uid, context)`:
    - Validates `uid` and `context` (throws `ValidationError` on empty or whitespace).
    - Delegates extraction to `aiProvider.extractContext(context)`.
  - `confirmDraftSave(uid, draft, target)`:
    - Validates `uid` and `draft.text` (throws `ValidationError` on empty or whitespace).
    - If `target === 'today'`: checks for an existing entry via `repo.findByDate(uid, today)`. If found, appends draft text (`existing.text + '\n\n' + draft.text`) via `repo.update`. If not found, creates a new entry via `repo.save`.
    - If `target === 'new'`: creates a new entry via `repo.save`.
    - Normalizes dates to midnight (`00:00:00.000`) for date queries.

- **`REQ-3` Chat Presentation Controllers & DTOs (`packages/chat/src/presentation/`):**
  - `SendMessageDto`:
    - `message: string` decorated with `@IsString()` and `@IsNotEmpty()`.
    - `mode: ChatMessageMode` decorated with `@IsIn(['text', 'voice'])`.
  - `ConfirmDraftDto`:
    - `draft: EntryDraftDto` decorated with `@ValidateNested()` and `@Type(() => EntryDraftDto)`.
    - `target: DraftSaveTarget` decorated with `@IsIn(['new', 'today'])`.
  - `ChatController`:
    - `@Controller('chat')` injecting `ChatService`.
    - `@Post('session') startSession(@Req() req)` delegating to `chatService.startSession(req.user.uid)`.
    - `@Post('message') sendMessage(@Req() req, @Body() dto: SendMessageDto, @Res() res: Response)`: invokes `chatService.sendMessage(req.user.uid, dto.message, dto.mode)` and streams/writes response.
    - `@Post('draft/confirm') confirmDraft(@Req() req, @Body() dto: ConfirmDraftDto)` delegating to `chatService.confirmDraftSave(req.user.uid, dto.draft, dto.target)`.

- **`REQ-4` Chat NestJS Module & Public API (`packages/chat/src/chat.module.ts`, `packages/chat/src/index.ts`):**
  - `ChatModule` must import `EntriesModule` and `HabitMemoryModule`.
  - Must declare `ChatController`.
  - Must provide `ChatService` via factory injecting `['EntryRepository', 'HabitMemoryStore', 'AIProvider']`.
  - Must export `ChatService`.
  - `index.ts` must re-export all domain models, services, controllers, DTOs, and `ChatModule`.

- **`REQ-5` Cron Presentation Webhook Controller (`packages/cron/src/presentation/controllers/cron.controller.ts`):**
  - `@Controller('cron')` injecting `HabitMemoryCronService` and `AttachmentCleanupCronService`.
  - Helper `verifySecret(headerSecret?: string)`: verifies matching `CRON_SECRET` from environment; throws `UnauthorizedException` (HTTP 401) on missing or mismatched secret. Permitted if `CRON_SECRET` is unset.
  - `@Public() @Post('habit-memory')` invoking `habitMemoryCronService.refreshAllUsersHabitMemory()`.
  - `@Public() @Post('attachment-cleanup')` invoking `attachmentCleanupCronService.cleanupOrphanAttachments()`.
  - `@Public() @Post('all')` invoking both maintenance routines.

- **`REQ-6` Cron NestJS Module & Public API (`packages/cron/src/cron.module.ts`, `packages/cron/src/index.ts`):**
  - `CronModule` must import `HabitMemoryModule` and `EntriesModule`.
  - Must declare `CronController`.
  - Must export `CronController`.
  - `index.ts` must re-export `CronController` and `CronModule`.

- **`REQ-7` Independent Package Compilation & Test Execution:**
  - `npm run build -w @journ/chat` and `npm run build -w @journ/cron` must compile cleanly with 0 TypeScript errors into their respective `dist/` directories.
  - `npm test -w @journ/chat` must discover and pass all 5 staged test suites (29 tests) with 100% pass rate.
  - `npm test -w @journ/cron` must discover and pass all 2 staged test suites (6 tests) with 100% pass rate.

- **`REQ-8` Monolith Non-Interference:**
  - Zero modifications to legacy files in `src/` or `frontend/`.
  - Legacy test suite (`npm test`) must continue passing with 100% success rate (32 suites, 172 tests).

### 1.4 Acceptance Criteria
- `AC-1` (Chat Build): `npm run build -w @journ/chat` produces `dist/` with valid declaration files (`.d.ts`) and source maps (`.map`) with 0 errors.
- `AC-2` (Cron Build): `npm run build -w @journ/cron` produces `dist/` with valid declaration files (`.d.ts`) and source maps (`.map`) with 0 errors.
- `AC-3` (Chat Test Suite): `npm test -w @journ/chat` passes 5/5 test suites (29/29 tests).
- `AC-4` (Cron Test Suite): `npm test -w @journ/cron` passes 2/2 test suites (6/6 tests).
- `AC-5` (All Workspaces Tests): `npm test --workspaces` executes all migrated packages (`@journ/common`, `@journ/account`, `@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`) with 100% pass rate.
- `AC-6` (Legacy Monolith Non-Interference): `git status -s` shows zero modifications in `src/` and `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Edge Cases & Failure Modes
- **Client Disconnection During Chat Stream:** `ChatController.sendMessage` writes directly to the response object; must end the response stream cleanly upon completion or error.
- **Unauthorized Cron Trigger:** Invocation without `x-cron-secret` matching `process.env.CRON_SECRET` must immediately throw `UnauthorizedException` before executing any background services.
- **Missing Today's Entry on Confirm Draft:** If target is `'today'` but no entry exists yet for the current calendar day, `confirmDraftSave` must seamlessly fall back to creating a new entry with the draft text.
- **Concurrent Message Dispatch Without Session:** Calling `sendMessage` with no active session in memory must throw `ConflictError` without executing the AI provider or writing to entry store.

### 1.6 Assumptions & Open Questions
- **Assumptions:**
  - `@journ/chat` and `@journ/cron` consume existing interfaces and services published by `@journ/common`, `@journ/entries`, and `@journ/habit-memory`.
  - `packages/cron` encapsulates `CronController` inside `presentation/controllers/` following DDD 3-layer architecture.
- **Open Questions:**
  - None.

---

## 2. Plan (How)

### 2.1 Files and Components to Add
- **`@journ/chat` (`packages/chat/src/`):**
  - `packages/chat/src/domain/chat-message-mode.ts`: `ChatMessageMode` union type (`'text' | 'voice'`).
  - `packages/chat/src/domain/chat-response.ts`: `ChatResponse` interface.
  - `packages/chat/src/domain/chat-session.ts`: `ChatMessage` and `ChatSession` interfaces.
  - `packages/chat/src/domain/draft-save-target.ts`: `DraftSaveTarget` union type (`'today' | 'new'`).
  - `packages/chat/src/domain/entry-draft.ts`: `EntryDraft` interface.
  - `packages/chat/src/domain/index.ts`: Domain barrel export.
  - `packages/chat/src/services/chat.service.ts`: `ChatService` domain service.
  - `packages/chat/src/services/index.ts`: Services barrel export.
  - `packages/chat/src/presentation/dto/send-message.dto.ts`: `SendMessageDto` with validation decorators.
  - `packages/chat/src/presentation/dto/confirm-draft.dto.ts`: `ConfirmDraftDto` with validation and transformation decorators.
  - `packages/chat/src/presentation/dto/index.ts`: DTO barrel export.
  - `packages/chat/src/presentation/controllers/chat.controller.ts`: `ChatController` REST controller.
  - `packages/chat/src/presentation/controllers/index.ts`: Controllers barrel export.
  - `packages/chat/src/presentation/index.ts`: Presentation barrel export.
  - `packages/chat/src/chat.module.ts`: `ChatModule` NestJS module wiring.
  - `packages/chat/src/index.ts`: Public package API entry point.

- **`@journ/cron` (`packages/cron/src/`):**
  - `packages/cron/src/presentation/controllers/cron.controller.ts`: `CronController` webhook controller.
  - `packages/cron/src/presentation/controllers/index.ts`: Controllers barrel export.
  - `packages/cron/src/presentation/index.ts`: Presentation barrel export.
  - `packages/cron/src/cron.module.ts`: `CronModule` NestJS module wiring.
  - `packages/cron/src/index.ts`: Public package API entry point.

### 2.2 Data Models, Interfaces, and Contracts
- Abstract interfaces & entities consumed:
  - `EntryRepository`, `Entry`, `AttachmentCleanupCronService`, `EntriesModule` from `@journ/entries`
  - `HabitMemoryStore`, `HabitMemory`, `HabitMemoryCronService`, `HabitMemoryModule` from `@journ/habit-memory`
  - `AIProvider`, `ValidationError`, `ConflictError`, `@Public()` from `@journ/common`
- New domain entities:
  - `ChatSession`, `ChatMessage`, `ChatMessageMode`, `ChatResponse`, `EntryDraft`, `DraftSaveTarget`.

### 2.3 Dependencies
- **Workspace Dependencies:**
  - `@journ/common`: shared errors, decorators, AI contracts.
  - `@journ/entries`: entry domain models, cleanup service, entries module.
  - `@journ/habit-memory`: habit memory models, cron service, habit memory module.
- **Root Hoisted Dependencies:**
  - `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `class-validator`, `class-transformer`, `reflect-metadata`.
- Zero new external dependencies.

### 2.4 Risks & Trade-offs
- **Risk:** Circular package dependencies between `@journ/chat`, `@journ/cron`, and upstream packages.
  - **Mitigation:** Strict Directed Acyclic Graph (DAG):
    `@journ/chat` & `@journ/cron` -> (`@journ/habit-memory`, `@journ/entries`) -> `@journ/common`.
    No reverse dependencies exist. Neither `entries` nor `habit-memory` depends on `chat` or `cron`.
- **Risk:** Streaming response lifecycle in `ChatController.sendMessage`.
  - **Mitigation:** Explicit header configuration (`Content-Type: text/plain; charset=utf-8`, `Transfer-Encoding: chunked`) and calling `res.write()` followed by `res.end()` with proper error handling.

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Domain Models) | `packages/chat/test/services/chat.service.spec.ts` |
| `REQ-2` (Chat Service) | `packages/chat/test/services/chat.service.spec.ts` |
| `REQ-3` (Chat Presentation & DTOs) | `packages/chat/test/presentation/controllers/chat.controller.spec.ts`<br>`packages/chat/test/presentation/dto/*.spec.ts` |
| `REQ-4` (Chat Module Wiring) | `packages/chat/test/chat.module.spec.ts` |
| `REQ-5` (Cron Webhook Controller) | `packages/cron/test/presentation/controllers/cron.controller.spec.ts` |
| `REQ-6` (Cron Module Wiring) | `packages/cron/test/cron.module.spec.ts` |
| `REQ-7` (Independent Build & Test) | `npm run build -w @journ/chat` & `npm test -w @journ/chat`<br>`npm run build -w @journ/cron` & `npm test -w @journ/cron` |
| `REQ-8` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites (172 tests) |

---

## 3. Tasks

- [x] **Task 1: Implement `@journ/chat` Domain Models (`REQ-1`)**
  - Create `packages/chat/src/domain/chat-message-mode.ts`.
  - Create `packages/chat/src/domain/chat-response.ts`.
  - Create `packages/chat/src/domain/chat-session.ts`.
  - Create `packages/chat/src/domain/draft-save-target.ts`.
  - Create `packages/chat/src/domain/entry-draft.ts`.
  - Create `packages/chat/src/domain/index.ts`.
  - *Done when:* Domain types and models export cleanly with zero external peer package dependencies.

- [x] **Task 2: Implement `@journ/chat` Service (`REQ-2`)**
  - Create `packages/chat/src/services/chat.service.ts` and `packages/chat/src/services/index.ts`.
  - *Done when:* `npm test -w @journ/chat packages/chat/test/services` passes all 22 unit tests green.

- [x] **Task 3: Implement `@journ/chat` Presentation Controllers & DTOs (`REQ-3`)**
  - Create `packages/chat/src/presentation/dto/send-message.dto.ts`.
  - Create `packages/chat/src/presentation/dto/confirm-draft.dto.ts`.
  - Create `packages/chat/src/presentation/dto/index.ts`.
  - Create `packages/chat/src/presentation/controllers/chat.controller.ts`.
  - Create `packages/chat/src/presentation/controllers/index.ts`.
  - Create `packages/chat/src/presentation/index.ts`.
  - *Done when:* `npm test -w @journ/chat packages/chat/test/presentation` passes all 5 tests (3 controller, 2 DTOs) green.

- [x] **Task 4: Wire `@journ/chat` Module & Public Entry Point (`REQ-4`)**
  - Create `packages/chat/src/chat.module.ts`.
  - Create `packages/chat/src/index.ts`.
  - *Done when:* `npm test -w @journ/chat packages/chat/test/chat.module.spec.ts` passes integration test green.

- [x] **Task 5: Implement `@journ/cron` Webhook Controller (`REQ-5`)**
  - Create `packages/cron/src/presentation/controllers/cron.controller.ts`.
  - Create `packages/cron/src/presentation/controllers/index.ts`.
  - Create `packages/cron/src/presentation/index.ts`.
  - *Done when:* `npm test -w @journ/cron packages/cron/test/presentation` passes all 5 controller unit tests green.

- [x] **Task 6: Wire `@journ/cron` Module & Public Entry Point (`REQ-6`)**
  - Create `packages/cron/src/cron.module.ts`.
  - Create `packages/cron/src/index.ts`.
  - *Done when:* `npm test -w @journ/cron packages/cron/test/cron.module.spec.ts` passes integration test green.

- [x] **Task 7: Validate Independent Builds & Package Test Suites (`REQ-7`)**
  - Run `npm run build -w @journ/chat` and `npm run build -w @journ/cron`.
  - Run `npm test -w @journ/chat` and `npm test -w @journ/cron`.
  - Run `npm test --workspaces` across all workspace packages.
  - *Done when:* Both packages compile with 0 TypeScript errors to `dist/`, and 100% of workspace tests pass green.

- [x] **Task 8: Verify Monolith Non-Interference (`REQ-8`)**
  - Run `git status -s` ensuring zero changes to `src/` or `frontend/`.
  - Run root `npm test`.
  - *Done when:* Root test runner executes all 32 legacy test suites (172 tests) with 100% pass rate.
