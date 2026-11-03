# Parallel Monorepo Migration Phase 5 (Part 1) — `@journ/chat` & `@journ/cron` Test Suite Specification
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-11-02

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 5 of the Parallel Monorepo Migration Plan extracts the final two feature domains from the legacy monolith (`src/`):
1. **`@journ/chat` (`packages/chat/`)**: The conversational AI companion providing multi-turn user dialogs, contextual awareness of writing habits via `@journ/habit-memory`, recent entry awareness via `@journ/entries`, and user-confirmed journal entry drafting.
2. **`@journ/cron` (`packages/cron/`)**: The Cloud Scheduler webhook entry points providing authenticated HTTP endpoints (`POST /cron/habit-memory`, `POST /cron/attachment-cleanup`, `POST /cron/all`) that orchestrate asynchronous maintenance routines across `@journ/habit-memory` and `@journ/entries`.

Following the Spec-Driven Development (SDD) paradigm and the Strangler Fig pattern established across Phases 1 through 4, Phase 5 is split into two parts:
- **Part 1 (this specification):** Establishes workspace packages `packages/chat/` and `packages/cron/`, isolates their respective Jest and TypeScript toolchains, and stages decoupled unit and integration test suites in `packages/chat/test/` and `packages/cron/test/` with strict 1:1 directory mirroring of the planned `src/` layout and mandatory JSDoc test classification metadata.
- **Part 2 (subsequent specification):** Extracts production domain entities, services, presentation controllers, and NestJS modules into `packages/chat/src/` and `packages/cron/src/`, verifies clean independent compilation, and confirms zero regressions in the legacy monolith.

The goal of this Part 1 specification is to define the test runners and explicit behavioral assertions for both packages before any production code is moved, ensuring complete verification coverage and decoupled execution.

### 1.2 Scope
- **In Scope:**
  - Workspace package manifests:
    - `packages/chat/package.json` declaring `@journ/chat` with `build` and `test` scripts.
    - `packages/cron/package.json` declaring `@journ/cron` with `build` and `test` scripts.
  - TypeScript configurations:
    - `packages/chat/tsconfig.json` extending root `tsconfig.base.json`.
    - `packages/cron/tsconfig.json` extending root `tsconfig.base.json`.
  - Isolated Jest runner configurations:
    - `packages/chat/jest.config.js` scoped strictly to `<rootDir>/test` with module aliases for `@journ/chat`, `@journ/entries`, `@journ/habit-memory`, and `@journ/common`.
    - `packages/cron/jest.config.js` scoped strictly to `<rootDir>/test` with module aliases for `@journ/cron`, `@journ/entries`, `@journ/habit-memory`, and `@journ/common`.
  - Global test mock setup in `packages/chat/test/setup.ts` to mock Firebase Admin SDK singletons (`getFirestore`, `getAuth`).
  - Strict 1:1 directory layout mirroring between `test/` and planned `src/` structures for both packages:
    - `packages/chat/test/services/` mirroring `packages/chat/src/services/`
    - `packages/chat/test/presentation/controllers/` mirroring `packages/chat/src/presentation/controllers/`
    - `packages/chat/test/presentation/dto/` mirroring `packages/chat/src/presentation/dto/`
    - `packages/cron/test/presentation/controllers/` mirroring `packages/cron/src/presentation/controllers/`
  - Staging decoupled test suites for `@journ/chat`:
    - Domain service test suite (`test/services/chat.service.spec.ts`).
    - Presentation controller test suite (`test/presentation/controllers/chat.controller.spec.ts`).
    - DTO validation schema test suites (`test/presentation/dto/send-message.dto.spec.ts`, `test/presentation/dto/confirm-draft.dto.spec.ts`).
    - NestJS module integration test suite (`test/chat.module.spec.ts`).
  - Staging decoupled test suites for `@journ/cron`:
    - Webhook controller test suite (`test/presentation/controllers/cron.controller.spec.ts`).
    - NestJS module integration test suite (`test/cron.module.spec.ts`).
  - Standardized JSDoc test metadata annotations (`@testType`, `@target`, `@description`) across 100% of staged test cases.

- **Explicitly Out of Scope:**
  - Extracting or writing production code under `packages/chat/src/` or `packages/cron/src/` (deferred strictly to Part 2).
  - Modifying, moving, or deleting any files in the legacy monolith `src/` or `frontend/`.
  - Modifying previously migrated packages (`@journ/common`, `@journ/account`, `@journ/entries`, `@journ/habit-memory`).
  - Establishing the composition root in `apps/backend` (Phase 6) or final cutover (Phase 7).

### 1.3 Requirements
- **`REQ-1` Package Scaffolding & Test Runner Isolation:**
  - `packages/chat/package.json` and `packages/cron/package.json` must be configured as private workspace packages under npm workspaces.
  - `packages/chat/jest.config.js` and `packages/cron/jest.config.js` must restrict test discovery strictly to `roots: ['<rootDir>/test']`.
  - Root `jest.config.js` (`roots: ['<rootDir>/src']`) must remain isolated from workspace test directories.

- **`REQ-2` Strict 1:1 Directory Layout Mirroring:**
  - The test file hierarchy for each package must replicate the target `src/` hierarchy path-for-path.
  - Legacy test files in flat directories (e.g. `src/chat/__tests__/chat.service.spec.ts` and `src/cron/__tests__/cron.controller.spec.ts`) must be staged in mirrored functional directories (`packages/chat/test/services/chat.service.spec.ts` and `packages/cron/test/presentation/controllers/cron.controller.spec.ts`).
  - Neither package may use catch-all `__tests__/` directories in `test/`.

- **`REQ-3` Chat Service Unit Test Suite (`packages/chat/test/services/chat.service.spec.ts`):**
  - Must define isolated unit tests for `ChatService`:
    - `startSession`:
      - Initializing session with retrieved `HabitMemory` when present in `HabitMemoryStore`.
      - Initializing session with default fallback values when `HabitMemoryStore.get` returns `null`.
      - Rejecting with `ValidationError` when `uid` is empty or whitespace.
      - Generating unique session IDs across consecutive sessions.
    - `sendMessage`:
      - Rejecting with `ValidationError` when `uid`, `message`, or `mode` are invalid.
      - Rejecting with `ConflictError` when no active session exists for the user.
      - Passing recent entries from `EntryRepository.listRecent` (7-day window) as context to `AIProvider.processChatTurn`.
      - Appending user and AI turns to session history.
      - Populating `draft` in response when AI extracts draft content.
    - `draftEntryFromContext`:
      - Delegating context extraction to `AIProvider.extractContext`.
      - Rejecting with `ValidationError` when `uid` or `context` are invalid.
    - `confirmDraftSave`:
      - Creating a new journal entry via `EntryRepository.save` when target is `'new'`.
      - Appending to existing entry for today via `EntryRepository.update` when target is `'today'` and entry exists.
      - Creating a new entry via `EntryRepository.save` when target is `'today'` but no entry exists yet.
      - Rejecting with `ValidationError` when `uid` or `draft.text` are invalid.

- **`REQ-4` Chat Controller Unit Test Suite (`packages/chat/test/presentation/controllers/chat.controller.spec.ts`):**
  - Must define unit tests for `ChatController`:
    - `startSession`: delegating to `chatService.startSession(req.user.uid)`.
    - `sendMessage`: writing response headers and body while delegating to `chatService.sendMessage(req.user.uid, dto.message, dto.mode)`.
    - `confirmDraft`: delegating to `chatService.confirmDraftSave(req.user.uid, dto.draft, dto.target)`.

- **`REQ-5` Chat DTO Schema Validation Test Suites (`packages/chat/test/presentation/dto/`):**
  - Must test `SendMessageDto` (`test/presentation/dto/send-message.dto.spec.ts`):
    - Validating valid `text` and `voice` mode payloads.
    - Rejecting invalid mode values.
  - Must test `ConfirmDraftDto` (`test/presentation/dto/confirm-draft.dto.spec.ts`):
    - Validating valid `'new'` and `'today'` targets with structured `draft` object.

- **`REQ-6` Chat Module Integration Test Suite (`packages/chat/test/chat.module.spec.ts`):**
  - Must define container integration test verifying that `ChatModule` compiles with NestJS `Test.createTestingModule` and resolves `ChatController` and `ChatService`.
  - Collaborator tokens (`'EntryRepository'`, `'HabitMemoryStore'`, `'AIProvider'`) must be provided via test stubs.

- **`REQ-7` Cron Controller Unit Test Suite (`packages/cron/test/presentation/controllers/cron.controller.spec.ts`):**
  - Must define unit tests for `CronController`:
    - `triggerHabitMemory`: invoking `habitMemoryCronService.refreshAllUsersHabitMemory()`.
    - `triggerAttachmentCleanup`: invoking `attachmentCleanupCronService.cleanupOrphanAttachments()`.
    - `triggerAll`: invoking both maintenance routines sequentially.
    - Secret verification:
      - Permitting execution when `CRON_SECRET` environment variable is not configured.
      - Permitting execution when `x-cron-secret` request header matches `process.env.CRON_SECRET`.
      - Throwing `UnauthorizedException` when `x-cron-secret` is missing or does not match `process.env.CRON_SECRET`, without executing the underlying job.

- **`REQ-8` Cron Module Integration Test Suite (`packages/cron/test/cron.module.spec.ts`):**
  - Must define container integration test verifying that `CronModule` compiles and resolves `CronController`.
  - External job services (`HabitMemoryCronService` and `AttachmentCleanupCronService`) must be resolved or mocked.

- **`REQ-9` Structured Test Documentation & Classification:**
  - 100% of test cases across all staged suites must include standardized JSDoc blocks:
    - `@testType`: strictly `Unit Test` or `Integration Test`.
    - `@target`: specific class, method, DTO, or module under test.
    - `@description`: clear explanation of test scenario and expected outcome.

- **`REQ-10` Monolith Non-Interference:**
  - Zero modifications to legacy files in `src/` or `frontend/`.
  - Legacy test suite (`npm test`) must continue passing with 100% success rate (32 suites, 172 tests).

### 1.4 Acceptance Criteria
- `AC-1` (Runner Isolation): Running `npm test` at workspace root discovers and runs only legacy monolith tests (`src/`), ignoring `packages/chat/test/` and `packages/cron/test/`.
- `AC-2` (Directory Mirroring): `packages/chat/test/` and `packages/cron/test/` structures match their respective `src/` counterparts path-for-path across all subdirectories (`services/`, `presentation/controllers/`, `presentation/dto/`).
- `AC-3` (Chat Service Tests): `test/services/chat.service.spec.ts` specifies 22 unit tests covering session creation, message handling, context drafting, confirmed draft saving, and input validation.
- `AC-4` (Chat Controller Tests): `test/presentation/controllers/chat.controller.spec.ts` specifies 3 unit tests covering session start, message dispatch, and draft save endpoints.
- `AC-5` (Chat DTO Tests): `test/presentation/dto/*.spec.ts` specifies 5 unit tests validating input schemas for messages and draft confirmations.
- `AC-6` (Chat Module Integration): `test/chat.module.spec.ts` specifies integration test compiling `ChatModule` and resolving its providers and controller.
- `AC-7` (Cron Controller Tests): `test/presentation/controllers/cron.controller.spec.ts` specifies 5 unit tests covering secret verification, job triggers, and combined maintenance execution.
- `AC-8` (Cron Module Integration): `test/cron.module.spec.ts` specifies integration test compiling `CronModule` and resolving its controller.
- `AC-9` (Metadata Compliance): 100% of test cases in both packages contain `@testType`, `@target`, and `@description` JSDoc annotations.
- `AC-10` (Non-Interference): `git status -s` shows 0 modified files in `src/` or `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Directory Mirroring & Test Layout Specification

#### 1.5.1 Structural Mirroring Map: `@journ/chat`
The `packages/chat/test/` layout replicates the internal folder hierarchy of `packages/chat/src/` 1:1. Flat legacy test placements (`src/chat/__tests__/` and `src/chat/presentation/controllers/__tests__/`) are restructured to match their exact production targets:

```text
packages/chat/
├── src/                                                                # (Part 2 Implementation Target)
│   ├── domain/
│   │   ├── chat-message-mode.ts
│   │   ├── chat-response.ts
│   │   ├── chat-session.ts
│   │   ├── draft-save-target.ts
│   │   ├── entry-draft.ts
│   │   └── index.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── chat.controller.ts
│   │   │   └── index.ts
│   │   ├── dto/
│   │   │   ├── confirm-draft.dto.ts
│   │   │   ├── send-message.dto.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── chat.service.ts
│   │   └── index.ts
│   ├── chat.module.ts
│   └── index.ts
└── test/                                                               # (Part 1 Staging Target)
    ├── setup.ts
    ├── chat.module.spec.ts                                             # Module DI container wiring [Integration Test]
    ├── presentation/
    │   ├── controllers/
    │   │   └── chat.controller.spec.ts                                 # REST presentation controller [Unit Test]
    │   └── dto/
    │       ├── confirm-draft.dto.spec.ts                               # DTO validation schema [Unit Test]
    │       └── send-message.dto.spec.ts                                # DTO validation schema [Unit Test]
    └── services/
        └── chat.service.spec.ts                                        # Domain business logic [Unit Test]
```

#### 1.5.2 Structural Mirroring Map: `@journ/cron`
The `packages/cron/test/` layout replicates the internal folder hierarchy of `packages/cron/src/` 1:1. The controller test is placed in `presentation/controllers/` to align with the standard 3-layer architecture:

```text
packages/cron/
├── src/                                                                # (Part 2 Implementation Target)
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── cron.controller.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── cron.module.ts
│   └── index.ts
└── test/                                                               # (Part 1 Staging Target)
    ├── cron.module.spec.ts                                             # Module DI container wiring [Integration Test]
    └── presentation/
        └── controllers/
            └── cron.controller.spec.ts                                 # Webhook controller [Unit Test]
```

#### 1.5.3 Test Code Commenting Syntax (Matching Phase 1-4 Format)
Every test block must be preceded by a structured JSDoc block:

```typescript
/**
 * @testType Unit Test
 * @target ChatService.sendMessage
 * @description Verifies that sending a message forwards recent entries as context to AIProvider and appends turns to session history.
 */
it('should process a chat turn and append the AI reply to the session history', async () => { ... });
```

For module integration tests:

```typescript
/**
 * @testType Integration Test
 * @target ChatModule
 * @description Verifies that the NestJS DI container compiles ChatModule and successfully resolves controllers and service providers.
 */
it('should compile ChatModule and resolve controllers and providers', async () => { ... });
```

#### 1.5.4 Test Suites Breakdown

##### `@journ/chat` Test Suites (29 Tests across 5 Files):
1. **`test/services/chat.service.spec.ts` (`[Unit Test]`, 22 cases):**
   - `startSession`:
     - Case 1: creates session with habit memory from store.
     - Case 2: creates session with default fallback habit memory when none exists.
     - Case 3: throws `ValidationError` when `uid` is empty.
     - Case 4: generates unique session ID.
   - `sendMessage`:
     - Case 5: processes chat turn and appends AI reply to history.
     - Case 6: attaches `EntryDraft` when extracted by AI.
     - Case 7: retrieves recent entries (7-day window) and passes as context to `AIProvider`.
     - Case 8: throws `ValidationError` when `uid` is empty.
     - Case 9: throws `ValidationError` when message is empty.
     - Case 10: throws `ValidationError` when message is whitespace-only.
     - Case 11: throws `ValidationError` when mode is invalid.
     - Case 12: throws `ConflictError` when no active session exists.
   - `draftEntryFromContext`:
     - Case 13: extracts and returns entry draft via `aiProvider.extractContext`.
     - Case 14: throws `ValidationError` when `uid` is empty.
     - Case 15: throws `ValidationError` when context is empty.
     - Case 16: throws `ValidationError` when context is whitespace-only.
   - `confirmDraftSave`:
     - Case 17: creates new entry when target is `'new'`.
     - Case 18: appends to today's entry when target is `'today'` and entry exists.
     - Case 19: creates new entry when target is `'today'` but no entry exists.
     - Case 20: throws `ValidationError` when `uid` is empty.
     - Case 21: throws `ValidationError` when draft text is empty.
     - Case 22: throws `ValidationError` when draft text is whitespace-only.
2. **`test/presentation/controllers/chat.controller.spec.ts` (`[Unit Test]`, 3 cases):**
   - Case 23: calls `startSession` with authenticated user `uid`.
   - Case 24: calls `sendMessage` and writes stream output.
   - Case 25: calls `confirmDraftSave` with authenticated `uid`, `draft`, and `target`.
3. **`test/presentation/dto/send-message.dto.spec.ts` (`[Unit Test]`, 3 cases):**
   - Case 26: validates valid text message.
   - Case 27: validates valid voice message.
   - Case 28: fails on invalid mode value.
4. **`test/presentation/dto/confirm-draft.dto.spec.ts` (`[Unit Test]`, 2 cases):**
   - Case 29: validates valid `'new'` target payload.
   - Case 30: validates valid `'today'` target payload.
5. **`test/chat.module.spec.ts` (`[Integration Test]`, 1 case):**
   - Case 31: compiles `ChatModule` and resolves `ChatController` and `ChatService`.

##### `@journ/cron` Test Suites (6 Tests across 2 Files):
1. **`test/presentation/controllers/cron.controller.spec.ts` (`[Unit Test]`, 5 cases):**
   - Case 1: executes habit memory trigger when no `CRON_SECRET` configured.
   - Case 2: executes habit memory trigger when matching `x-cron-secret` header is provided.
   - Case 3: throws `UnauthorizedException` when secret header is missing or mismatched.
   - Case 4: executes attachment cleanup trigger when header matches secret.
   - Case 5: executes combined maintenance routines (`triggerAll`) when header matches secret.
2. **`test/cron.module.spec.ts` (`[Integration Test]`, 1 case):**
   - Case 6: compiles `CronModule` and resolves `CronController`.

### 1.6 Edge Cases & Failure Modes
- **Missing or Invalid Cron Secret:** Invocation with an invalid or missing `x-cron-secret` header must reject immediately with `UnauthorizedException` (HTTP 401) before triggering any underlying jobs.
- **Missing Chat Session:** Sending a message before calling `startSession` must throw `ConflictError` (HTTP 409).
- **Empty / Whitespace Payload Validation:** Empty strings for `uid`, `message`, `context`, or `draft.text` must trigger `ValidationError` (HTTP 400) and never proceed to AI or persistence calls.
- **Date Boundary Handling on Today's Entry:** When saving with target `'today'`, the lookup must normalize the current date to midnight (`00:00:00.000`) to guarantee correct calendar-day matching.

### 1.7 Assumptions & Open Questions
- **Assumptions:**
  - `@journ/chat` consumes domain contracts and stores already published by `@journ/common`, `@journ/entries`, and `@journ/habit-memory`.
  - `@journ/cron` consumes `HabitMemoryCronService` from `@journ/habit-memory` and `AttachmentCleanupCronService` from `@journ/entries`.
  - `packages/cron` places `CronController` under `presentation/controllers/` to uphold 3-layer architecture consistency across all monorepo packages.
- **Open Questions:**
  - None.

---

## 2. Plan (How)

### 2.1 Files and Components to Add
- **`@journ/chat` (`packages/chat/`):**
  - `packages/chat/package.json`: Private workspace package definition declaring `@journ/chat`, scripts (`build`, `test`), and dependencies on `@journ/common`, `@journ/entries`, and `@journ/habit-memory`.
  - `packages/chat/tsconfig.json`: TypeScript configuration extending `../../tsconfig.base.json` targeting `<rootDir>/test` and `<rootDir>/src`.
  - `packages/chat/jest.config.js`: Dedicated Jest configuration file scoped strictly to `<rootDir>/test` with module aliases and setup file.
  - `packages/chat/test/setup.ts`: Global test setup mocking Firebase Admin SDK singletons (`getFirestore`, `getAuth`).
  - `packages/chat/test/services/chat.service.spec.ts`: Unit tests for `ChatService` mirroring `packages/chat/src/services/chat.service.ts`.
  - `packages/chat/test/presentation/controllers/chat.controller.spec.ts`: Unit tests for `ChatController` mirroring `packages/chat/src/presentation/controllers/chat.controller.ts`.
  - `packages/chat/test/presentation/dto/send-message.dto.spec.ts`: Validation tests for `SendMessageDto` mirroring `packages/chat/src/presentation/dto/send-message.dto.ts`.
  - `packages/chat/test/presentation/dto/confirm-draft.dto.spec.ts`: Validation tests for `ConfirmDraftDto` mirroring `packages/chat/src/presentation/dto/confirm-draft.dto.ts`.
  - `packages/chat/test/chat.module.spec.ts`: Integration test for `ChatModule` mirroring `packages/chat/src/chat.module.ts`.

- **`@journ/cron` (`packages/cron/`):**
  - `packages/cron/package.json`: Private workspace package definition declaring `@journ/cron`, scripts (`build`, `test`), and dependencies on `@journ/common`, `@journ/entries`, and `@journ/habit-memory`.
  - `packages/cron/tsconfig.json`: TypeScript configuration extending `../../tsconfig.base.json` targeting `<rootDir>/test` and `<rootDir>/src`.
  - `packages/cron/jest.config.js`: Dedicated Jest configuration file scoped strictly to `<rootDir>/test` with module aliases.
  - `packages/cron/test/presentation/controllers/cron.controller.spec.ts`: Unit tests for `CronController` mirroring `packages/cron/src/presentation/controllers/cron.controller.ts`.
  - `packages/cron/test/cron.module.spec.ts`: Integration test for `CronModule` mirroring `packages/cron/src/cron.module.ts`.

### 2.2 Data Models, Interfaces, and Contracts
- **`@journ/chat` Collaborators & Contracts:**
  - `EntryRepository` (from `@journ/entries`): `save`, `update`, `findByDate`, `listRecent`.
  - `HabitMemoryStore` (from `@journ/habit-memory`): `get`, `save`.
  - `AIProvider` (from `@journ/common`): `processChatTurn`, `extractContext`.
  - Domain models: `ChatSession`, `ChatMessage`, `ChatResponse`, `ChatMessageMode`, `EntryDraft`, `DraftSaveTarget`, `Entry`, `HabitMemory`.
  - Domain exceptions: `ValidationError`, `ConflictError` (from `@journ/common`).
- **`@journ/cron` Collaborators & Contracts:**
  - `HabitMemoryCronService` (from `@journ/habit-memory`): `refreshAllUsersHabitMemory`.
  - `AttachmentCleanupCronService` (from `@journ/entries`): `cleanupOrphanAttachments`.
  - Exceptions: `UnauthorizedException` (from `@nestjs/common`).

### 2.3 Dependencies
- **Workspace Packages:**
  - `@journ/common`: workspace package dependency for shared errors (`ValidationError`, `ConflictError`), decorators (`@Public()`), and cloud interfaces (`AIProvider`).
  - `@journ/entries`: workspace package dependency for `EntryRepository`, `AttachmentCleanupCronService`, and `EntriesModule`.
  - `@journ/habit-memory`: workspace package dependency for `HabitMemoryStore`, `HabitMemoryCronService`, and `HabitMemoryModule`.
- **Root Hoisted Dependencies:**
  - `@nestjs/common`, `@nestjs/core`, `@nestjs/testing`, `class-validator`, `class-transformer`, `reflect-metadata`, `jest`, `ts-jest`, `typescript`.
- Zero new external npm packages required.

### 2.4 Risks & Trade-offs
- **Risk:** Premature generation of production code in `packages/chat/src/` or `packages/cron/src/`.
  - **Mitigation:** Strict SDD boundary. Part 1 defines and stages only package manifests, tsconfig, jest config, and files in `test/`. All files in `src/` are deferred to Part 2.
- **Risk:** Jest runner collision between legacy monolith runner and new package runners.
  - **Mitigation:** Legacy `jest.config.js` restricts discovery to `roots: ['<rootDir>/src']` and `testMatch: ['**/__tests__/**/*.spec.ts']`. The new package test runners use `roots: ['<rootDir>/test']` and `testMatch: ['**/*.spec.ts']`.
- **Risk:** Firebase Admin singleton leakage during unit test execution in `@journ/chat`.
  - **Mitigation:** Global mock configuration in `packages/chat/test/setup.ts` registered in `jest.config.js` via `setupFiles`.
- **Risk:** Environment variable leakage during Cron secret testing.
  - **Mitigation:** Staged tests in `test/presentation/controllers/cron.controller.spec.ts` backup and restore `process.env.CRON_SECRET` in `beforeEach` and `afterAll` hooks.

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Runner Isolation) | Execution of root `npm test` verifying 0 package tests executed |
| `REQ-2` (Directory Mirroring) | Inspection of `packages/chat/test/` and `packages/cron/test/` directory hierarchies |
| `REQ-3` (Chat Service Tests) | `packages/chat/test/services/chat.service.spec.ts` |
| `REQ-4` (Chat Controller Tests) | `packages/chat/test/presentation/controllers/chat.controller.spec.ts` |
| `REQ-5` (Chat DTO Tests) | `packages/chat/test/presentation/dto/send-message.dto.spec.ts`, `confirm-draft.dto.spec.ts` |
| `REQ-6` (Chat Module Integration) | `packages/chat/test/chat.module.spec.ts` |
| `REQ-7` (Cron Controller Tests) | `packages/cron/test/presentation/controllers/cron.controller.spec.ts` |
| `REQ-8` (Cron Module Integration) | `packages/cron/test/cron.module.spec.ts` |
| `REQ-9` (Structured Test Documentation) | Verification of `@testType`, `@target`, `@description` across all 7 test files |
| `REQ-10` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites (172 tests) with zero file changes in `src/` |

---

## 3. Tasks

- [x] **Task 1: Scaffold Package Configuration & Runner Isolation for `@journ/chat` and `@journ/cron` (`REQ-1`)**
  - Create `packages/chat/package.json`, `packages/chat/tsconfig.json`, `packages/chat/jest.config.js`, and `packages/chat/test/setup.ts`.
  - Create `packages/cron/package.json`, `packages/cron/tsconfig.json`, and `packages/cron/jest.config.js`.
  - Run `npm install` at workspace root to link both packages into npm workspaces.
  - *Done when:* `npm query .workspace` returns both `@journ/chat` and `@journ/cron`, and both `jest.config.js` files are isolated to `<rootDir>/test`.

- [x] **Task 2: Stage `@journ/chat` Mirrored Domain Service Unit Tests (`REQ-2`, `REQ-3`, `REQ-9`)**
  - Create `packages/chat/test/services/chat.service.spec.ts`.
  - *Done when:* File exists under `packages/chat/test/services/` with all 22 test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 3: Stage `@journ/chat` Mirrored Presentation Controller & DTO Tests (`REQ-2`, `REQ-4`, `REQ-5`, `REQ-9`)**
  - Create `packages/chat/test/presentation/controllers/chat.controller.spec.ts`.
  - Create `packages/chat/test/presentation/dto/send-message.dto.spec.ts`.
  - Create `packages/chat/test/presentation/dto/confirm-draft.dto.spec.ts`.
  - *Done when:* All 3 files exist under `packages/chat/test/presentation/` with all 8 test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 4: Stage `@journ/chat` Module Integration Test (`REQ-2`, `REQ-6`, `REQ-9`)**
  - Create `packages/chat/test/chat.module.spec.ts`.
  - *Done when:* File exists directly under `packages/chat/test/` with test case annotated with `@testType Integration Test`, `@target`, and `@description`.

- [x] **Task 5: Stage `@journ/cron` Mirrored Presentation Controller Unit Tests (`REQ-2`, `REQ-7`, `REQ-9`)**
  - Create `packages/cron/test/presentation/controllers/cron.controller.spec.ts`.
  - *Done when:* File exists under `packages/cron/test/presentation/controllers/` with all 5 test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 6: Stage `@journ/cron` Module Integration Test (`REQ-2`, `REQ-8`, `REQ-9`)**
  - Create `packages/cron/test/cron.module.spec.ts`.
  - *Done when:* File exists directly under `packages/cron/test/` with test case annotated with `@testType Integration Test`, `@target`, and `@description`.

- [x] **Task 7: Audit Test Code Commenting & Structural Mirroring Compliance (`REQ-2`, `REQ-9`)**
  - Audit all 7 staged test files across `packages/chat/test/` and `packages/cron/test/` for 100% compliance with JSDoc annotations and 1:1 path mirroring against future production `src/`.
  - *Done when:* Zero test cases lack standard JSDoc headers, and all 7 test paths replicate the planned `src/` structure path-for-path.

- [x] **Task 8: Verify Monolith Non-Interference (`REQ-10`)**
  - Check `git status -s` ensuring zero changes to `src/` or `frontend/`.
  - Execute root `npm test`.
  - *Done when:* Root test runner executes all 32 legacy test suites (172 tests) with 100% pass rate.
