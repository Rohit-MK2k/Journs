# Parallel Monorepo Migration Phase 1 (Part 2) — `@journ/common` Production Code Extraction
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-10-26

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 1 Part 1 (`Documentation/Specs/parallel-monorepo-migration-phase1-001.md`) established the workspace configuration (`package.json`, `tsconfig.json`, `jest.config.js`) and staged 8 decoupled unit/integration test suites in `packages/common/test/`.

The goal of Phase 1 Part 2 is to extract and implement the production code in `packages/common/src/` to satisfy the staged test suite, enable independent package build/test execution, and provide the shared contract abstractions needed by downstream packages (`@journ/account`, `@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`).

Under the Strangler Fig pattern, the legacy monolith in `src/common/` remains untouched and continues running without interruption.

### 1.2 Scope
- **In Scope:**
  - Defining cross-domain contract interfaces in `packages/common/src/interfaces/` (`contracts.ts`, `ai-provider.interface.ts`, `storage-provider.interface.ts`, `index.ts`).
  - Extracting domain exception hierarchy in `packages/common/src/errors/` (`domain.error.ts`, `not-found.error.ts`, `conflict.error.ts`, `validation.error.ts`, `index.ts`).
  - Extracting authentication guard and route decorators in `packages/common/src/guards/` (`firebase-auth.guard.ts`) and `packages/common/src/decorators/` (`public.decorator.ts`).
  - Extracting cloud provider adapters in `packages/common/src/infrastructure/` (Firebase Admin SDK config, Firebase Storage provider, Gemini AI provider).
  - Extracting presentation components in `packages/common/src/presentation/` (`domain-exception.filter.ts`, `health.controller.ts`).
  - Extracting summarization heuristics and utilities in `packages/common/src/utils/` (`summarization.util.ts`).
  - Wiring providers, injection tokens, and controllers in `packages/common/src/common.module.ts` and exporting public package symbols via `packages/common/src/index.ts`.
  - Independent build verification (`npm run build -w @journ/common`) and test execution (`npm test -w @journ/common`).
  - Monolith non-interference verification (`npm test`).

- **Explicitly Out of Scope:**
  - Modifying or deleting any file within legacy `src/` or `frontend/`.
  - Modifying the staged test files in `packages/common/test/` (established in Part 1).
  - Extracting domain feature packages (`@journ/account`, `@journ/entries`, etc. — Phase 2+).
  - Wiring composition roots in `apps/` (Phase 6+).

### 1.3 Requirements
- **`REQ-1` Cross-Domain Contract Interfaces:** `packages/common/src/interfaces/` must define abstract contracts for cross-domain models (`IChatSession`, `IHabitMemory`, `IEntry`, `IChatMessage`, `IChatTurnResponse`) and service providers (`AIProvider`, `StorageProvider`). Interfaces must not import or depend on any code outside `@journ/common`.
- **`REQ-2` Domain Exception Hierarchy:** `packages/common/src/errors/` must implement `DomainError` base class, along with `NotFoundError`, `ConflictError`, and `ValidationError`.
- **`REQ-3` Authentication Guard & Public Decorator:** `packages/common/src/guards/` must provide `FirebaseAuthGuard` that verifies Bearer ID tokens via Firebase Admin Auth and binds the decoded user to `request.user`. `packages/common/src/decorators/` must provide `@Public()` metadata decorator.
- **`REQ-4` Cloud Provider Adapters:** `packages/common/src/infrastructure/` must implement:
  - `initializeFirebaseAdmin()` with idempotent initialization, credentials file parsing, and GCP project ID fallback.
  - `FirebaseStorageProvider` implementing `StorageProvider` for upload URL generation, signed read URLs, and file deletion.
  - `GeminiAIProvider` implementing `AIProvider` for summarization (> 20 words threshold, skipping code blocks), chat generation, context extraction, and habit memory parsing.
- **`REQ-5` Presentation Layer Components:** `packages/common/src/presentation/` must implement `DomainExceptionFilter` (translating domain errors into HTTP 400, 404, 409, 500 status payloads) and `HealthController` (`GET /` returning service info and `GET /health` returning status).
- **`REQ-6` Text Summarization Utilities:** `packages/common/src/utils/` must implement `countWords`, `isProgrammingCode`, and `shouldSummarize` heuristics.
- **`REQ-7` Module Wiring & Public API Exports:** `packages/common/src/common.module.ts` must declare a `@Global()` NestJS module exporting `AIProvider`, `StorageProvider`, `GENAI_CLIENT`, `VERTEX_INDEX_CLIENT`, `VERTEX_MATCH_CLIENT`, and `HealthController`. `packages/common/src/index.ts` must barrel export public contracts, guards, filters, errors, and providers.
- **`REQ-8` Independent Build & Test Verification:** `npm run build -w @journ/common` must compile cleanly with `tsc` emitting JavaScript and type declarations to `packages/common/dist/`. `npm test -w @journ/common` must pass all 8 staged test suites with 100% green assertions.
- **`REQ-9` Monolith Non-Interference:** The legacy monolith (`src/`) must experience zero modifications, and `npm test` must run with 100% pass rate.

### 1.4 Acceptance Criteria
- **`AC-1` (Interfaces):** Compiles cleanly with zero peer-package imports. All staged tests requiring contract types resolve without TypeScript errors.
- **`AC-2` (Errors):** `new ValidationError('msg')` instanceof `DomainError` evaluates to `true`; `test/presentation/filters/domain-exception.filter.spec.ts` passes.
- **`AC-3` (Auth Guard):** `test/guards/firebase-auth.guard.spec.ts` passes all 3 test cases (valid token, missing header, invalid token).
- **`AC-4` (Infrastructure):** `test/infrastructure/firebase/firebase.config.spec.ts`, `test/infrastructure/providers/firebase-storage.provider.spec.ts`, and `test/infrastructure/providers/gemini-ai.provider.spec.ts` pass all unit test cases.
- **`AC-5` (Presentation):** `test/presentation/controllers/health.controller.spec.ts` and `test/presentation/filters/domain-exception.filter.spec.ts` pass all test cases.
- **`AC-6` (Utils):** `test/utils/summarization.util.spec.ts` passes all heuristic test cases.
- **`AC-7` (Module):** `test/common.module.spec.ts` passes module compilation and DI provider resolution.
- **`AC-8` (Isolated Execution):** `npm run build -w @journ/common` exits code 0; `npm test -w @journ/common` runs and passes 8/8 suites.
- **`AC-9` (Non-Interference):** `git status` shows 0 modified files in `src/`; `npm test` passes all 32 legacy suites (172/172 tests).

### 1.5 Edge Cases & Failure Modes
- **Circular Dependency Leakage:** In the legacy monolith, `gemini-ai.provider.ts` imported domain models from `chat/domain`, `habit-memory/domain`, and `entries/domain`. In `@journ/common`, this is strictly forbidden; providers must only consume the abstract contract interfaces defined in `src/interfaces/contracts.ts`.
- **Firebase Initialization Idempotency:** Invoking `initializeFirebaseAdmin()` multiple times must not crash or re-initialize if an existing app is present in `getApps()`.
- **Environment Variable Fallbacks:** `GENAI_CLIENT` and Firebase configuration must tolerate missing optional environment variables gracefully (e.g. falling back to dummy development keys for local test booting).

### 1.6 Assumptions & Open Questions
- **Assumption:** All required third-party packages (`@nestjs/common`, `@google/genai`, `@google-cloud/aiplatform`, `firebase-admin`) are already installed at the root workspace level and resolve via workspace hoisting.
- **Assumption:** No code in `src/` should be refactored or deleted during this phase.
- **Open Questions:** None. Staged test suites in `packages/common/test/` provide exact behavioral requirements for each component.

---

## 2. Plan (How)

### 2.1 Files and Components to Add
- `packages/common/src/interfaces/contracts.ts`: Defines `IChatSession`, `IHabitMemory`, `IEntry`, `IChatMessage`, and `IChatTurnResponse`.
- `packages/common/src/interfaces/ai-provider.interface.ts`: Defines `AIProvider` contract bound to local contracts.
- `packages/common/src/interfaces/storage-provider.interface.ts`: Defines `StorageProvider` and `UploadUrlResult`.
- `packages/common/src/interfaces/index.ts`: Barrel export for interfaces.
- `packages/common/src/errors/domain.error.ts`: Base `DomainError` class.
- `packages/common/src/errors/not-found.error.ts`: `NotFoundError` subclass.
- `packages/common/src/errors/conflict.error.ts`: `ConflictError` subclass.
- `packages/common/src/errors/validation.error.ts`: `ValidationError` subclass.
- `packages/common/src/errors/index.ts`: Barrel export for domain errors.
- `packages/common/src/decorators/public.decorator.ts`: `@Public()` route metadata decorator.
- `packages/common/src/decorators/index.ts`: Barrel export for decorators.
- `packages/common/src/guards/firebase-auth.guard.ts`: `FirebaseAuthGuard` implementing NestJS `CanActivate`.
- `packages/common/src/guards/index.ts`: Barrel export for guards.
- `packages/common/src/infrastructure/firebase/firebase.config.ts`: `initializeFirebaseAdmin()` function.
- `packages/common/src/infrastructure/providers/firebase-storage.provider.ts`: `FirebaseStorageProvider` implementing `StorageProvider`.
- `packages/common/src/infrastructure/providers/gemini-ai.provider.ts`: `GeminiAIProvider` implementing `AIProvider` using contracts from `src/interfaces/`.
- `packages/common/src/presentation/controllers/health.controller.ts`: `HealthController` handling `GET /` and `GET /health`.
- `packages/common/src/presentation/filters/domain-exception.filter.ts`: `DomainExceptionFilter` implementing `ExceptionFilter`.
- `packages/common/src/utils/summarization.util.ts`: Functions `countWords`, `isProgrammingCode`, and `shouldSummarize`.
- `packages/common/src/utils/index.ts`: Barrel export for utilities.
- `packages/common/src/common.module.ts`: `@Global()` NestJS module configuring DI providers and exports.
- `packages/common/src/index.ts`: Root barrel export for public package consumer API.

### 2.2 Data Models, Interfaces, and Contracts
- Cross-domain models are represented as pure interfaces without business logic or framework coupling:
  - `IChatMessage`: `{ role: 'user' | 'assistant' | 'model'; content: string; timestamp?: Date }`
  - `IChatSession`: `{ id: string; uid: string; startedAt: Date; habitMemory?: IHabitMemory; messages?: IChatMessage[] }`
  - `IHabitMemory`: `{ uid: string; updatedAt: Date; topics: string[]; frequency: string; tone: string; writingHabits?: IHabitWritingStyle }`
  - `IEntry`: `{ id?: string; uid?: string; text: string; title?: string; createdAt?: Date; updatedAt?: Date }`
  - `IChatTurnResponse`: `{ replyText: string; extractedDraft?: string }`

### 2.3 Dependencies
- Uses exclusively project-level installed dependencies: `@nestjs/common`, `@nestjs/core`, `@google/genai`, `@google-cloud/aiplatform`, `firebase-admin`, `reflect-metadata`.
- No new external dependencies will be added.

### 2.4 Risks & Trade-offs
- **Risk:** Type drift between legacy entities in `src/` and new contract interfaces in `packages/common/src/interfaces/contracts.ts`.
  - **Mitigation:** Contracts mirror the property names and types currently expected by `gemini-ai.provider.ts` and the staged tests.
- **Risk:** Unintentional interference with monolith build.
  - **Mitigation:** Zero files inside `src/` or `frontend/` are touched. Root `tsconfig.json` and `jest.config.js` remain scoped strictly to `src/`.

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Contracts) | `packages/common/test/infrastructure/providers/gemini-ai.provider.spec.ts` |
| `REQ-2` (Domain Errors) | `packages/common/test/presentation/filters/domain-exception.filter.spec.ts` |
| `REQ-3` (Auth Guard & Decorator) | `packages/common/test/guards/firebase-auth.guard.spec.ts` |
| `REQ-4` (Firebase Init) | `packages/common/test/infrastructure/firebase/firebase.config.spec.ts` |
| `REQ-4` (Storage Provider) | `packages/common/test/infrastructure/providers/firebase-storage.provider.spec.ts` |
| `REQ-4` (Gemini Provider) | `packages/common/test/infrastructure/providers/gemini-ai.provider.spec.ts` |
| `REQ-5` (Health Controller) | `packages/common/test/presentation/controllers/health.controller.spec.ts` |
| `REQ-5` (Exception Filter) | `packages/common/test/presentation/filters/domain-exception.filter.spec.ts` |
| `REQ-6` (Summarization Utils) | `packages/common/test/utils/summarization.util.spec.ts` |
| `REQ-7` (Module Wiring) | `packages/common/test/common.module.spec.ts` |
| `REQ-8` (Independent Build & Test) | `npm run build -w @journ/common` & `npm test -w @journ/common` |
| `REQ-9` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites |

---

## 3. Tasks

- [x] **Task 1: Implement Cross-Domain Contract Interfaces (`REQ-1`)**
  - Create `packages/common/src/interfaces/contracts.ts`, `ai-provider.interface.ts`, `storage-provider.interface.ts`, and `index.ts`.
  - *Done when:* `packages/common/src/interfaces/index.ts` exists and exports all contract types with zero external package imports.

- [x] **Task 2: Implement Domain Exception Hierarchy (`REQ-2`)**
  - Create `packages/common/src/errors/domain.error.ts`, `not-found.error.ts`, `conflict.error.ts`, `validation.error.ts`, and `index.ts`.
  - *Done when:* `packages/common/src/errors/index.ts` exports all 4 error classes inheriting from `DomainError`.

- [x] **Task 3: Implement Authentication Guard & Decorators (`REQ-3`)**
  - Create `packages/common/src/decorators/public.decorator.ts` and `packages/common/src/decorators/index.ts`.
  - Create `packages/common/src/guards/firebase-auth.guard.ts` and `packages/common/src/guards/index.ts`.
  - *Done when:* `npm test -w @journ/common packages/common/test/guards/firebase-auth.guard.spec.ts` passes 3/3 test cases.

- [x] **Task 4: Implement Text Summarization Utilities (`REQ-6`)**
  - Create `packages/common/src/utils/summarization.util.ts` and `packages/common/src/utils/index.ts`.
  - *Done when:* `npm test -w @journ/common packages/common/test/utils/summarization.util.spec.ts` passes all test cases.

- [x] **Task 5: Implement Cloud Infrastructure Providers (`REQ-4`)**
  - Create `packages/common/src/infrastructure/firebase/firebase.config.ts`.
  - Create `packages/common/src/infrastructure/providers/firebase-storage.provider.ts`.
  - Create `packages/common/src/infrastructure/providers/gemini-ai.provider.ts` consuming contracts from `src/interfaces/`.
  - *Done when:* Tests for `firebase.config.spec.ts`, `firebase-storage.provider.spec.ts`, and `gemini-ai.provider.spec.ts` pass 100% green.

- [x] **Task 6: Implement Presentation Layer Components (`REQ-5`)**
  - Create `packages/common/src/presentation/controllers/health.controller.ts`.
  - Create `packages/common/src/presentation/filters/domain-exception.filter.ts`.
  - *Done when:* Tests for `health.controller.spec.ts` and `domain-exception.filter.spec.ts` pass 100% green.

- [x] **Task 7: Wire Global NestJS Module and Package Exports (`REQ-7`)**
  - Create `packages/common/src/common.module.ts` exporting `AIProvider`, `StorageProvider`, `GENAI_CLIENT`, `VERTEX_INDEX_CLIENT`, `VERTEX_MATCH_CLIENT`, and `HealthController`.
  - Create `packages/common/src/index.ts` as package root barrel export.
  - *Done when:* `npm test -w @journ/common packages/common/test/common.module.spec.ts` passes module compilation and DI resolution.

- [x] **Task 8: Validate Independent Package Build and Test Suite (`REQ-8`)**
  - Run `npm run build -w @journ/common`.
  - Run `npm test -w @journ/common`.
  - *Done when:* TypeScript compiles cleanly with 0 errors to `packages/common/dist/` and all 8 test suites pass green.

- [x] **Task 9: Verify Monolith Non-Interference (`REQ-9`)**
  - Run `git status -s` to ensure zero modifications in `src/`.
  - Run `npm test` across root.
  - *Done when:* All 32 legacy test suites (172 tests) pass without errors or regressions.
