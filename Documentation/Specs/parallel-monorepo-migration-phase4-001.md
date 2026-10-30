# Parallel Monorepo Migration Phase 4 (Part 1) — `@journ/habit-memory` Test Suite Specification
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-10-30

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 4 of the Parallel Monorepo Migration Plan extracts the Habit Memory bounded context from the legacy monolith (`src/habit-memory/`) into an isolated workspace package (`packages/habit-memory/`). 

In the Journ architecture, Habit Memory functions as the user's background behavioral observer:
- It analyzes journal entries written over a rolling 30-day window.
- It leverages Gemini AI via `@journ/common` to derive behavioral patterns: recurring topics, writing frequency, emotional tone, and stylistic habits (depth, vocabulary, timing, structure).
- It persists these insights in Firestore at `users/{uid}/habitMemory/default`.
- It executes a daily scheduled job (`0 2 * * *` at 2:00 AM) to maintain fresh habit profiles for active users.
- It exposes a REST endpoint (`GET /habit-memory`) to serve habit insights to the frontend and provides context for downstream conversational AI (`@journ/chat`).

Following the Spec-Driven Development (SDD) paradigm and the Strangler Fig pattern established in Phase 1 (`@journ/common`), Phase 2 (`@journ/account`), and Phase 3 (`@journ/entries`), Phase 4 is partitioned into two distinct stages:
- **Part 1 (this specification):** Scaffolding workspace configuration (`package.json`, `tsconfig.json`, `jest.config.js`, `test/setup.ts`) and staging decoupled test suites in `packages/habit-memory/test/` with standardized metadata annotations (`@testType`, `@target`, `@description`) and strict 1:1 directory mirroring of the planned `packages/habit-memory/src/` hierarchy.
- **Part 2 (subsequent specification):** Implementing production domain models, services, stores, cron jobs, presentation controllers, and NestJS module wiring in `packages/habit-memory/src/`, resolving independent builds and verifying zero regressions on the legacy monolith.

The goal of this Part 1 specification is to define the isolated test runner environment and explicit test cases for `@journ/habit-memory` prior to writing production code, guaranteeing runner isolation, strict directory mirroring, and contract adherence.

### 1.2 Scope
- **In Scope:**
  - Workspace package manifest for `packages/habit-memory/package.json` declaring `@journ/habit-memory` with dedicated `build` and `test` scripts.
  - TypeScript compiler configuration in `packages/habit-memory/tsconfig.json` extending root `tsconfig.base.json`.
  - Dedicated Jest configuration in `packages/habit-memory/jest.config.js` scoped strictly to `<rootDir>/test` with module aliases for `@journ/habit-memory`, `@journ/entries`, and `@journ/common`.
  - Global test mock setup in `packages/habit-memory/test/setup.ts` to mock Firebase Admin SDK singletons (`getFirestore`, `getAuth`).
  - Strict 1:1 directory layout mirroring between `packages/habit-memory/test/` and the planned `packages/habit-memory/src/` structure (`services/`, `infrastructure/repositories/`, `infrastructure/jobs/`, `presentation/controllers/`).
  - Staging decoupled unit test suites for:
    - Habit memory domain service (`test/services/habit-memory.service.spec.ts`).
    - Habit memory cron job service (`test/infrastructure/jobs/habit-memory.cron.spec.ts`).
    - Firestore habit memory persistence store (`test/infrastructure/repositories/firestore-habit-memory.store.spec.ts`).
    - Habit memory presentation controller (`test/presentation/controllers/habit-memory.controller.spec.ts`).
  - Staging decoupled integration test suite for:
    - NestJS module container wiring and provider resolution (`test/habit-memory.module.spec.ts`).
  - Mandatory JSDoc metadata annotations (`@testType`, `@target`, `@description`) across all staged test cases matching Phase 1, Phase 2, and Phase 3 standards.

- **Explicitly Out of Scope:**
  - Implementing production classes under `packages/habit-memory/src/` (deferred strictly to Part 2).
  - Modifying or deleting any file within legacy `src/` or `frontend/`.
  - Adding dependencies on peer feature packages other than `@journ/entries` and `@journ/common` (e.g. `@journ/account`, `@journ/chat`, `@journ/cron`).
  - Wiring composition roots in `apps/` (Phase 6).

### 1.3 Requirements
- **`REQ-1` Package Configuration & Test Runner Isolation:**
  - `packages/habit-memory/package.json` must configure `@journ/habit-memory` as a private workspace package with dependencies on `@journ/common` (`*`), `@journ/entries` (`*`), and required peer/dev dependencies.
  - `packages/habit-memory/jest.config.js` must restrict test discovery strictly to `roots: ['<rootDir>/test']` with module aliases mapping `@journ/habit-memory/(.*)` to `<rootDir>/src/$1` and `@journ/habit-memory` to `<rootDir>/src/index`.
  - Root `jest.config.js` (`roots: ['<rootDir>/src']`) must remain completely insulated from `packages/habit-memory/test/`.

- **`REQ-2` Strict Directory Layout Mirroring:**
  - The directory hierarchy of `packages/habit-memory/test/` must strictly mirror `packages/habit-memory/src/` path-for-path across all subdirectories (`services/`, `infrastructure/repositories/`, `infrastructure/jobs/`, `presentation/controllers/`).
  - Every test file must reside in the exact mirrored path corresponding to its future production target file.
  - Legacy test file located in the root `src/habit-memory/__tests__/habit-memory.service.spec.ts` must be relocated to `packages/habit-memory/test/services/habit-memory.service.spec.ts` to enforce 1:1 parity with its production target in `packages/habit-memory/src/services/habit-memory.service.ts`.

- **`REQ-3` Habit Memory Service Test Suite (`test/services/habit-memory.service.spec.ts`):**
  - Must define unit tests for `HabitMemoryService`:
    - `refreshMemory`:
      - Deriving habit memory from recent entries and persisting to `HabitMemoryStore`.
      - Returning existing habit memory without AI derivation when no recent entries exist.
      - Returning default empty habit memory structure when no recent entries and no existing memory exist.
      - Rejecting with `ValidationError` when `uid` is empty or whitespace-only.
      - Enforcing rolling 30-day lookback window (`LOOKBACK_DAYS = 30`) on entry query (`EntryRepository.listRecent`).
      - Setting `uid` and updating `updatedAt` timestamp on the derived memory.
      - Persisting derived memory to `HabitMemoryStore.save`.
    - `getMemory`:
      - Rejecting with `ValidationError` when `uid` is empty or whitespace-only.
      - Returning persisted memory from store when found.
      - Returning `null` when no memory exists for the given user.

- **`REQ-4` Habit Memory Cron Service Test Suite (`test/infrastructure/jobs/habit-memory.cron.spec.ts`):**
  - Must define unit tests for `HabitMemoryCronService`:
    - Iterating users listed by `firebase-admin/auth` (`getAuth().listUsers(1000)`).
    - Invoking `habitMemoryService.refreshMemory(uid)` for each user record.
    - Ensuring errors during refresh of an individual user record are caught, logged, and do not halt refresh of subsequent users.
    - Handling global user listing failure gracefully without unhandled exception.

- **`REQ-5` Firestore Habit Memory Store Test Suite (`test/infrastructure/repositories/firestore-habit-memory.store.spec.ts`):**
  - Must define unit tests for `FirestoreHabitMemoryStore`:
    - `save`: persisting habit memory to single document at path `users/{uid}/habitMemory/default`.
    - `get`: retrieving habit memory from `users/{uid}/habitMemory/default` and converting Firestore Timestamp to JavaScript `Date`.
    - `get`: returning `null` when document does not exist (`doc.exists === false`).

- **`REQ-6` Habit Memory Controller Test Suite (`test/presentation/controllers/habit-memory.controller.spec.ts`):**
  - Must define unit tests for `HabitMemoryController.getHabitMemory`:
    - Returning habit memory retrieved from `habitMemoryService.getMemory(req.user.uid)`.
    - Returning default empty structure (`{ uid, topics: [], frequency: 'none', tone: 'neutral', updatedAt: null }`) when service returns `null`.

- **`REQ-7` Habit Memory Module Integration Test Suite (`test/habit-memory.module.spec.ts`):**
  - Must define integration test using `@nestjs/testing` (`Test.createTestingModule`).
  - Must verify that `HabitMemoryModule` compiles and resolves `HabitMemoryController`, `HabitMemoryService`, `HabitMemoryCronService`, and token `'HabitMemoryStore'`.
  - Collaborators from external modules (`'EntryRepository'` from `@journ/entries`, `'AIProvider'` from `@journ/common`) must be stubbed or resolved cleanly.

- **`REQ-8` Structured Test Documentation & Classification:**
  - 100% of test cases across all staged suites must include structured JSDoc headers:
    - `@testType`: strictly `Unit Test` or `Integration Test`.
    - `@target`: specific class, method, or module under test.
    - `@description`: clear explanation of the scenario and expected outcome.

- **`REQ-9` Monolith Non-Interference:**
  - Running root `npm test` must continue executing legacy monolith tests in `src/` with 100% pass rate (32 suites, 172 tests).
  - Zero files within `src/` or `frontend/` may be added, modified, or deleted.

### 1.4 Acceptance Criteria
- **`AC-1` (Runner Isolation):** Running `npm test` at workspace root discovers and runs only legacy monolith tests (`src/`), ignoring `packages/habit-memory/test/`.
- **`AC-2` (Directory Mirroring):** `packages/habit-memory/test/` structure matches `packages/habit-memory/src/` path-for-path across all subdirectories (`services/`, `infrastructure/repositories/`, `infrastructure/jobs/`, `presentation/controllers/`).
- **`AC-3` (Service Tests):** `test/services/habit-memory.service.spec.ts` specifies tests covering `refreshMemory` (AI derivation, 30-day window, fallbacks, validation) and `getMemory`.
- **`AC-4` (Cron Tests):** `test/infrastructure/jobs/habit-memory.cron.spec.ts` specifies tests covering user iteration, per-user error isolation, and error logging.
- **`AC-5` (Store Tests):** `test/infrastructure/repositories/firestore-habit-memory.store.spec.ts` specifies tests covering Firestore single-doc read/write at `users/{uid}/habitMemory/default`.
- **`AC-6` (Controller Tests):** `test/presentation/controllers/habit-memory.controller.spec.ts` specifies tests for `GET /habit-memory` endpoint and null fallback response.
- **`AC-7` (Module Wiring Integration):** `test/habit-memory.module.spec.ts` compiles `HabitMemoryModule` and resolves registered controller, services, and store token.
- **`AC-8` (Metadata Compliance):** 100% of test cases in `packages/habit-memory/test/` contain `@testType`, `@target`, and `@description` JSDoc annotations.
- **`AC-9` (Monolith Non-Interference):** `git status -s` shows 0 modified files in `src/` or `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Directory Mirroring & Test Layout Specification

#### 1.5.1 Structural Mirroring Map
The `packages/habit-memory/test/` layout replicates the internal folder hierarchy of `packages/habit-memory/src/` 1:1. Legacy test placement anomalies (such as tests placed in a flat `__tests__/` directory) are rectified to match their exact production target paths:

```text
packages/habit-memory/
├── src/                                                                # (Part 2 Implementation Target)
│   ├── domain/
│   │   ├── habit-memory.ts
│   │   └── index.ts
│   ├── infrastructure/
│   │   ├── jobs/
│   │   │   ├── habit-memory.cron.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── firestore-habit-memory.store.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── interfaces/
│   │   ├── habit-memory-store.interface.ts
│   │   └── index.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── habit-memory.controller.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── habit-memory.service.ts
│   │   └── index.ts
│   ├── habit-memory.module.ts
│   └── index.ts
└── test/                                                               # (Part 1 Staging Target)
    ├── setup.ts
    ├── habit-memory.module.spec.ts                                     # Module DI container wiring [Integration Test]
    ├── infrastructure/
    │   ├── jobs/
    │   │   └── habit-memory.cron.spec.ts                               # Cron schedule & user iteration [Unit Test]
    │   └── repositories/
    │       └── firestore-habit-memory.store.spec.ts                    # Firestore single doc CRUD [Unit Test]
    ├── presentation/
    │   └── controllers/
    │       └── habit-memory.controller.spec.ts                         # REST endpoint & fallback handling [Unit Test]
    └── services/
        └── habit-memory.service.spec.ts                                # Core business logic & AI derivation [Unit Test]
```

#### 1.5.2 Test Code Commenting Syntax (Matching Phase 1, 2, & 3 Format)
Every test block must be preceded by a structured JSDoc block:

```typescript
/**
 * @testType Unit Test
 * @target HabitMemoryService.refreshMemory
 * @description Verifies that habit memory is derived from recent entries via AIProvider and saved to HabitMemoryStore.
 */
it('should derive habit memory from recent entries and save it', async () => { ... });
```

For module integration tests:

```typescript
/**
 * @testType Integration Test
 * @target HabitMemoryModule
 * @description Verifies that the NestJS DI container compiles HabitMemoryModule and resolves all controllers, services, and store tokens.
 */
it('should compile HabitMemoryModule and resolve controllers and providers', async () => { ... });
```

#### 1.5.3 Test Suites Breakdown
1. **`test/services/habit-memory.service.spec.ts` (`[Unit Test]`):**
   - Asserts habit derivation from recent entries via `AIProvider.deriveHabitMemory`.
   - Asserts reuse of existing habit memory when no recent entries exist.
   - Asserts default habit memory fallback when no entries and no existing memory exist.
   - Asserts `ValidationError` thrown when `uid` is empty or whitespace-only.
   - Asserts rolling 30-day window lookup on `EntryRepository.listRecent`.
   - Asserts `uid` and `updatedAt` are assigned to derived memory.
   - Asserts derived memory is persisted to `HabitMemoryStore.save`.
   - Asserts `getMemory` rejects empty or whitespace `uid` with `ValidationError`.
   - Asserts `getMemory` returns persisted memory when present and `null` when missing.
2. **`test/infrastructure/jobs/habit-memory.cron.spec.ts` (`[Unit Test]`):**
   - Asserts user iteration via `getAuth().listUsers(1000)`.
   - Asserts `habitMemoryService.refreshMemory` called for each user record.
   - Asserts individual user refresh errors do not halt execution for subsequent users.
   - Asserts global user listing errors are handled gracefully without unhandled rejections.
3. **`test/infrastructure/repositories/firestore-habit-memory.store.spec.ts` (`[Unit Test]`):**
   - Asserts `save` writes to collection `users/{uid}/habitMemory` with document ID `default`.
   - Asserts `get` retrieves document and converts Firestore Timestamp `updatedAt` to JavaScript `Date`.
   - Asserts `get` returns `null` when document does not exist.
4. **`test/presentation/controllers/habit-memory.controller.spec.ts` (`[Unit Test]`):**
   - Asserts `GET /habit-memory` delegates to `habitMemoryService.getMemory(req.user.uid)`.
   - Asserts default structure (`topics: []`, `frequency: 'none'`, `tone: 'neutral'`, `updatedAt: null`) is returned when service returns `null`.
5. **`test/habit-memory.module.spec.ts` (`[Integration Test]`):**
   - Asserts NestJS DI container compilation and provider resolution for `HabitMemoryController`, `HabitMemoryService`, `HabitMemoryCronService`, and `'HabitMemoryStore'`.

### 1.6 Edge Cases & Failure Modes
- **Decoupled Boundary Contracts:** `HabitMemoryService` interacts with AI and entry persistence exclusively through `AIProvider` (from `@journ/common`) and `EntryRepository` (from `@journ/entries`).
- **Runner Cross-Contamination:** Root `jest.config.js` uses `roots: ['<rootDir>/src']` and `testMatch: ['**/__tests__/**/*.spec.ts']`. The new package test files reside under `packages/habit-memory/test/*.spec.ts`, preventing accidental double execution by the legacy runner.
- **Premature Implementation Guard:** No production code in `packages/habit-memory/src/` will be generated during Part 1. Production code is strictly deferred to Part 2.

### 1.7 Assumptions & Open Questions
- **Assumption:** Third-party packages (`@nestjs/common`, `@nestjs/core`, `@nestjs/schedule`, `@nestjs/testing`, `firebase-admin`, `reflect-metadata`) are hoisted from root `node_modules`.
- **Assumption:** Shared base configuration (`tsconfig.base.json`) and foundation packages (`@journ/common`, `@journ/entries`) are compiled and available in the workspace.
- **Open Questions:** None. Staged test suites mirror existing capabilities in `src/habit-memory/` while standardizing annotations and isolating runner configurations.

---

## 2. Plan (How)

### 2.1 Files and Components to Add
- `packages/habit-memory/package.json`: Private workspace package definition declaring `@journ/habit-memory`, scripts (`build`, `test`), and dependencies on `@journ/common` and `@journ/entries`.
- `packages/habit-memory/tsconfig.json`: TypeScript configuration extending `../../tsconfig.base.json` targeting `<rootDir>/test` and `<rootDir>/src`.
- `packages/habit-memory/jest.config.js`: Dedicated Jest configuration file scoped strictly to `<rootDir>/test` with module aliases and setup file.
- `packages/habit-memory/test/setup.ts`: Global test setup mocking Firebase Admin SDK (`getFirestore`, `getAuth`).
- `packages/habit-memory/test/services/habit-memory.service.spec.ts`: Unit tests for `HabitMemoryService` mirroring `src/services/habit-memory.service.ts`.
- `packages/habit-memory/test/infrastructure/repositories/firestore-habit-memory.store.spec.ts`: Unit tests for `FirestoreHabitMemoryStore` mirroring `src/infrastructure/repositories/firestore-habit-memory.store.ts`.
- `packages/habit-memory/test/infrastructure/jobs/habit-memory.cron.spec.ts`: Unit tests for `HabitMemoryCronService` mirroring `src/infrastructure/jobs/habit-memory.cron.ts`.
- `packages/habit-memory/test/presentation/controllers/habit-memory.controller.spec.ts`: Unit tests for `HabitMemoryController` mirroring `src/presentation/controllers/habit-memory.controller.ts`.
- `packages/habit-memory/test/habit-memory.module.spec.ts`: Integration test for `HabitMemoryModule` mirroring `src/habit-memory.module.ts`.

### 2.2 Data Models, Interfaces, and Contracts
- Decoupled interface mocks used in tests:
  - `HabitMemoryStore`: contract for persisting and retrieving user habit memory (`get`, `save`).
  - `EntryRepository`: contract from `@journ/entries` (`listRecent`).
  - `AIProvider`: contract from `@journ/common` (`deriveHabitMemory`).
- Domain models and types:
  - `HabitMemory`: root entity with `uid`, `topics`, `frequency`, `tone`, `writingHabits`, `updatedAt`.
  - `WritingHabits`: sub-entity with `structure`, `depth`, `timing`, `vocabulary`.
- Domain exceptions imported from `@journ/common`: `ValidationError`.

### 2.3 Dependencies
- `@journ/common`: workspace package dependency for shared errors (`ValidationError`) and infrastructure contracts (`AIProvider`).
- `@journ/entries`: workspace package dependency for `EntryRepository` contract and `EntriesModule`.
- Root hoisted dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/schedule`, `@nestjs/testing`, `firebase-admin`, `reflect-metadata`, `jest`, `ts-jest`, `typescript`.
- Zero new external packages will be added.

### 2.4 Risks & Trade-offs
- **Risk:** Root Jest runner accidentally discovering and executing tests in `packages/habit-memory/test/`.
  - **Mitigation:** Root `jest.config.js` sets `roots: ['<rootDir>/src']` and `testMatch: ['**/__tests__/**/*.spec.ts']`, completely isolating it from `packages/habit-memory/test/*.spec.ts`.
- **Risk:** Premature generation of `packages/habit-memory/src/` production files during Part 1.
  - **Mitigation:** Restricting Part 1 strictly to `packages/habit-memory/package.json`, `tsconfig.json`, `jest.config.js`, `test/setup.ts`, and test files under `test/`. Production files remain deferred to Part 2.
- **Risk:** Firebase Admin singleton ESM import leakage during unit test execution.
  - **Mitigation:** Global mock configuration in `packages/habit-memory/test/setup.ts` registered in `jest.config.js` via `setupFiles`.

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Runner Isolation) | Execution of root `npm test` verifying 0 package tests executed |
| `REQ-2` (Directory Mirroring) | Inspection of `packages/habit-memory/test/` directory hierarchy |
| `REQ-3` (Habit Memory Service) | `packages/habit-memory/test/services/habit-memory.service.spec.ts` |
| `REQ-4` (Cron Schedule Job) | `packages/habit-memory/test/infrastructure/jobs/habit-memory.cron.spec.ts` |
| `REQ-5` (Firestore Store) | `packages/habit-memory/test/infrastructure/repositories/firestore-habit-memory.store.spec.ts` |
| `REQ-6` (Presentation Controller) | `packages/habit-memory/test/presentation/controllers/habit-memory.controller.spec.ts` |
| `REQ-7` (Module Wiring) | `packages/habit-memory/test/habit-memory.module.spec.ts` |
| `REQ-8` (Comment Standards) | Verification of `@testType`, `@target`, `@description` across all 5 test files |
| `REQ-9` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites (172 tests) |

---

## 3. Tasks

- [x] **Task 1: Scaffold Package Configuration & Runner Isolation (`REQ-1`)**
  - Create `packages/habit-memory/package.json`, `packages/habit-memory/tsconfig.json`, `packages/habit-memory/jest.config.js`, and `packages/habit-memory/test/setup.ts`.
  - Run `npm install` at workspace root to register `@journ/habit-memory` in npm workspaces.
  - *Done when:* `packages/habit-memory/jest.config.js` is isolated to `<rootDir>/test`, `@journ/habit-memory` appears in `npm query .workspace`, and root `npm test` ignores `packages/habit-memory/`.

- [x] **Task 2: Stage Mirrored Domain Service Unit Tests (`REQ-2`, `REQ-3`, `REQ-8`)**
  - Create `packages/habit-memory/test/services/habit-memory.service.spec.ts`.
  - *Done when:* File exists under `packages/habit-memory/test/services/` with all 11 test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 3: Stage Mirrored Infrastructure Repository & Job Unit Tests (`REQ-2`, `REQ-4`, `REQ-5`, `REQ-8`)**
  - Create `packages/habit-memory/test/infrastructure/repositories/firestore-habit-memory.store.spec.ts`.
  - Create `packages/habit-memory/test/infrastructure/jobs/habit-memory.cron.spec.ts`.
  - *Done when:* Both files exist under `packages/habit-memory/test/infrastructure/` with 100% of test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 4: Stage Mirrored Presentation Controller Unit Tests (`REQ-2`, `REQ-6`, `REQ-8`)**
  - Create `packages/habit-memory/test/presentation/controllers/habit-memory.controller.spec.ts`.
  - *Done when:* File exists under `packages/habit-memory/test/presentation/controllers/` with all test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 5: Stage Module Integration Test Suite (`REQ-2`, `REQ-7`, `REQ-8`)**
  - Create `packages/habit-memory/test/habit-memory.module.spec.ts` testing `HabitMemoryModule` DI compilation and provider resolution.
  - *Done when:* File exists directly under `packages/habit-memory/test/` with test case annotated with `@testType Integration Test`, `@target`, and `@description`.

- [x] **Task 6: Audit Test Code Commenting & Structural Mirroring Compliance (`REQ-2`, `REQ-8`)**
  - Review all 5 staged test files across `packages/habit-memory/test/` to confirm 100% compliance with JSDoc headers (`@testType`, `@target`, `@description`) and exact 1:1 path mirroring against future `packages/habit-memory/src/`.
  - *Done when:* Zero test cases in `packages/habit-memory/test/` are missing standard JSDoc classification blocks, and all 5 test paths match their `src/` counterparts.

- [x] **Task 7: Verify Monolith Non-Interference (`REQ-9`)**
  - Run `git status -s` to verify zero modified files in `src/` or `frontend/`.
  - Run `npm test` across root workspace.
  - *Done when:* Root test runner executes all 32 legacy test suites (172 tests) with 100% pass rate.
