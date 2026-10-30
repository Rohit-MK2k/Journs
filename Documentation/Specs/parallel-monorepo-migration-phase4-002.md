# Parallel Monorepo Migration Phase 4 (Part 2) — `@journ/habit-memory` Production Code Extraction
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-10-30

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 4 Part 1 (`Documentation/Specs/parallel-monorepo-migration-phase4-001.md`) established the package scaffolding, workspace linkage, runner isolation, and 5 staged test suites (20 test cases) in `packages/habit-memory/test/`.

The goal of Phase 4 Part 2 is to extract and implement the production code in `packages/habit-memory/src/` to satisfy all staged test suites, enable independent package build/test execution, and uphold strict Domain-Driven Design (DDD) layer separation and Dependency Inversion.

Under the Strangler Fig pattern, the legacy monolith in `src/habit-memory/` remains completely untouched and continues functioning without modification or regression.

### 1.2 Scope
- **In Scope:**
  - Defining domain models in `packages/habit-memory/src/domain/`:
    - `habit-memory.ts`: `HabitMemory` root entity and `WritingHabits` sub-entity capturing behavioral and stylistic insights.
    - `index.ts`: barrel export for domain models.
  - Defining persistence contracts in `packages/habit-memory/src/interfaces/`:
    - `habit-memory-store.interface.ts`: `HabitMemoryStore` abstract persistence contract (`get`, `save`).
    - `index.ts`: barrel export for interfaces.
  - Extracting core business logic in `packages/habit-memory/src/services/`:
    - `habit-memory.service.ts`: `HabitMemoryService` coordinating rolling 30-day lookback entry retrieval, AI habit pattern derivation, default fallback handling, input validation, and persistence.
    - `index.ts`: barrel export for services.
  - Extracting cloud infrastructure adapters and jobs in `packages/habit-memory/src/infrastructure/`:
    - `repositories/firestore-habit-memory.store.ts`: `FirestoreHabitMemoryStore` implementing `HabitMemoryStore` against collection `users/{uid}/habitMemory` (document `default`).
    - `repositories/index.ts`: barrel export for repositories.
    - `jobs/habit-memory.cron.ts`: `HabitMemoryCronService` scheduled job (`0 2 * * *` at 2:00 AM) iterating users via `firebase-admin/auth` and triggering `refreshMemory` with per-user error isolation.
    - `jobs/index.ts`: barrel export for jobs.
    - `index.ts`: barrel export for infrastructure.
  - Extracting presentation controllers in `packages/habit-memory/src/presentation/`:
    - `controllers/habit-memory.controller.ts`: `HabitMemoryController` exposing `GET /habit-memory` with fallback default memory formatting when null.
    - `controllers/index.ts`: barrel export for controllers.
    - `index.ts`: barrel export for presentation.
  - Wiring NestJS module and public package API in:
    - `packages/habit-memory/src/habit-memory.module.ts`: `HabitMemoryModule` configuring controllers, providers, factory injection for `HabitMemoryService`, and DI tokens (`'HabitMemoryStore'`).
    - `packages/habit-memory/src/index.ts`: public package entry point.
  - Independent package compilation (`npm run build -w @journ/habit-memory`) emitting clean `.js`, `.d.ts`, and `.map` files into `packages/habit-memory/dist/` with zero TypeScript errors.
  - Independent package test execution (`npm test -w @journ/habit-memory`) passing all 5 staged test suites (20 test cases) with 100% pass rate.
  - Monolith non-interference verification (`npm test`).

- **Explicitly Out of Scope:**
  - Modifying or deleting any file within legacy `src/` or `frontend/`.
  - Modifying the staged test files in `packages/habit-memory/test/`.
  - Extracting downstream domain packages (`@journ/chat`, `@journ/cron` — Phase 5).
  - Wiring composition roots in `apps/` (Phase 6).

### 1.3 Requirements
- **`REQ-1` Domain Models & Persistence Contracts:**
  - `packages/habit-memory/src/domain/habit-memory.ts` must define:
    - `WritingHabits`: interface specifying `structure`, `depth`, `timing`, and `vocabulary`.
    - `HabitMemory`: root domain entity specifying `uid`, `topics: string[]`, `frequency: string`, `tone: string`, optional `writingHabits?: WritingHabits`, and `updatedAt: Date`.
  - `packages/habit-memory/src/interfaces/habit-memory-store.interface.ts` must define:
    - `HabitMemoryStore`: abstract contract declaring `get(uid: string): Promise<HabitMemory | null>` and `save(uid: string, memory: HabitMemory): Promise<void>`.
  - Contracts and domain models must have zero external peer package imports.

- **`REQ-2` Habit Memory Domain Service:**
  - `packages/habit-memory/src/services/habit-memory.service.ts` must implement `HabitMemoryService`:
    - Constructor injecting `repo: EntryRepository`, `habitStore: HabitMemoryStore`, and `aiProvider: AIProvider`.
    - `getMemory(uid: string)`:
      - Validates `uid` and throws `ValidationError` (from `@journ/common`) if empty or whitespace-only.
      - Delegates to `habitStore.get(uid.trim())` and returns persisted memory or `null`.
    - `refreshMemory(uid: string)`:
      - Validates `uid` and throws `ValidationError` if empty or whitespace-only.
      - Queries recent entries over a rolling 30-day window (`LOOKBACK_DAYS = 30`) via `repo.listRecent(uid, since)`.
      - If no recent entries exist: returns existing persisted memory from `habitStore.get(uid)`, or default empty structure (`{ uid, topics: [], frequency: 'none', tone: 'neutral', updatedAt: new Date() }`) without invoking AI derivation.
      - If entries exist: calls `aiProvider.deriveHabitMemory(entries)` to derive habit patterns.
      - Assigns `uid` and new `updatedAt: new Date()` to the derived memory.
      - Persists to store via `habitStore.save(uid, memory)` before returning.

- **`REQ-3` Cloud Infrastructure Adapters & Scheduled Jobs:**
  - `packages/habit-memory/src/infrastructure/repositories/firestore-habit-memory.store.ts` must implement `FirestoreHabitMemoryStore`:
    - Implements `HabitMemoryStore`.
    - `save(uid, memory)`: writes to `users/{uid}/habitMemory/default` via `set(memory)`.
    - `get(uid)`: reads document `users/{uid}/habitMemory/default`; converts Firestore Timestamp (`updatedAt.toDate()`) to JavaScript `Date`; returns `null` if document does not exist.
  - `packages/habit-memory/src/infrastructure/jobs/habit-memory.cron.ts` must implement `HabitMemoryCronService`:
    - `@Injectable()` service with `@Cron('0 2 * * *')` method `refreshAllUsersHabitMemory()`.
    - Fetches user records via `getAuth().listUsers(1000)`.
    - Loops over user records and calls `habitMemoryService.refreshMemory(userRecord.uid)` inside a per-user `try...catch` block so individual failures are logged without terminating the loop.
    - Outer `try...catch` block ensuring unhandled listing errors are logged cleanly.

- **`REQ-4` Presentation Controller:**
  - `packages/habit-memory/src/presentation/controllers/habit-memory.controller.ts` must implement `HabitMemoryController`:
    - `@Controller('habit-memory')` injecting `HabitMemoryService`.
    - `@Get()` endpoint `getHabitMemory(@Req() req: any)` retrieving memory for `req.user.uid`.
    - If `getMemory` returns `null`, returns fallback object: `{ uid: req.user.uid, topics: [], frequency: 'none', tone: 'neutral', updatedAt: null }`.

- **`REQ-5` NestJS Module Wiring & Public API:**
  - `packages/habit-memory/src/habit-memory.module.ts` must declare `HabitMemoryModule`:
    - Imports: `[EntriesModule, ScheduleModule.forRoot()]`.
    - Controllers: `[HabitMemoryController]`.
    - Providers:
      - Binds `'HabitMemoryStore'` to `FirestoreHabitMemoryStore`.
      - Provides `HabitMemoryService` via factory function injecting `['EntryRepository', 'HabitMemoryStore', 'AIProvider']`.
      - Provides `HabitMemoryCronService`.
    - Exports: `['HabitMemoryStore', HabitMemoryService, HabitMemoryCronService]`.
  - `packages/habit-memory/src/index.ts` must export all public package symbols (domain models, interfaces, services, infrastructure classes, controllers, and module).

- **`REQ-6` Independent Package Build & Test Execution:**
  - `npm run build -w @journ/habit-memory` must execute `tsc` and emit clean `.js`, `.d.ts`, and `.map` files into `packages/habit-memory/dist/` with zero TypeScript errors.
  - `npm test -w @journ/habit-memory` must execute all 5 staged test suites (20 test cases) with 100% pass rate.

- **`REQ-7` Monolith Non-Interference:**
  - Zero files within `src/` or `frontend/` may be added, edited, or deleted.
  - Root `npm test` must continue passing all 32 legacy test suites (172 tests).

### 1.4 Acceptance Criteria
- **`AC-1` (Domain & Interfaces):** `packages/habit-memory/src/domain/index.ts` and `src/interfaces/index.ts` export all types cleanly with zero peer package dependencies.
- **`AC-2` (Service Tests):** `npm test -w @journ/habit-memory packages/habit-memory/test/services` passes all 11 unit tests green.
- **`AC-3` (Infrastructure Tests):** `npm test -w @journ/habit-memory packages/habit-memory/test/infrastructure` passes all 6 tests (3 store, 3 cron) green.
- **`AC-4` (Presentation Tests):** `npm test -w @journ/habit-memory packages/habit-memory/test/presentation` passes both controller unit tests green.
- **`AC-5` (Module Integration):** `npm test -w @journ/habit-memory packages/habit-memory/test/habit-memory.module.spec.ts` passes DI container compilation and provider resolution green.
- **`AC-6` (Independent Build & Full Test):** `npm run build -w @journ/habit-memory` exits code 0; `npm test -w @journ/habit-memory` runs 5 suites (20 tests) with 100% pass rate.
- **`AC-7` (Monolith Non-Interference):** `git status -s` shows 0 modified files in `src/` or `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Edge Cases & Failure Modes
- **Decoupled Boundary Contracts:** `@journ/habit-memory` consumes `AIProvider` and `ValidationError` from `@journ/common`, and `EntryRepository` / `EntriesModule` from `@journ/entries` via top-level workspace package imports, avoiding brittle relative path bindings.
- **Null & Timestamp Safety in Store:** Firestore returns timestamps with a `.toDate()` method. `FirestoreHabitMemoryStore` handles both `.toDate()` objects and string/Date representations gracefully.
- **Individual User Failure Isolation:** In `HabitMemoryCronService`, if AI derivation or Firestore writes throw for one user, the error is logged and the cron loop continues for remaining users.

### 1.6 Assumptions & Open Questions
- **Assumption:** Third-party libraries (`@nestjs/common`, `@nestjs/schedule`, `firebase-admin`, `reflect-metadata`) are hoisted from root `node_modules`.
- **Assumption:** `@journ/common` and `@journ/entries` packages are compiled and available in the workspace.
- **Open Questions:** None. Staged test suites in `packages/habit-memory/test/` provide exact behavioral specifications.

---

## 2. Plan (How)

### 2.1 Files and Components to Add
- `packages/habit-memory/src/domain/habit-memory.ts`: Domain entities `HabitMemory` and `WritingHabits`.
- `packages/habit-memory/src/domain/index.ts`: Barrel export for domain models.
- `packages/habit-memory/src/interfaces/habit-memory-store.interface.ts`: `HabitMemoryStore` persistence contract.
- `packages/habit-memory/src/interfaces/index.ts`: Barrel export for interfaces.
- `packages/habit-memory/src/services/habit-memory.service.ts`: `HabitMemoryService` coordinating rolling 30-day lookback, AI derivation, fallbacks, and persistence.
- `packages/habit-memory/src/services/index.ts`: Barrel export for services.
- `packages/habit-memory/src/infrastructure/repositories/firestore-habit-memory.store.ts`: Firestore persistence adapter for habit memories.
- `packages/habit-memory/src/infrastructure/repositories/index.ts`: Barrel export for repositories.
- `packages/habit-memory/src/infrastructure/jobs/habit-memory.cron.ts`: Scheduled job for 02:00 AM user habit memory refresh.
- `packages/habit-memory/src/infrastructure/jobs/index.ts`: Barrel export for jobs.
- `packages/habit-memory/src/infrastructure/index.ts`: Barrel export for infrastructure.
- `packages/habit-memory/src/presentation/controllers/habit-memory.controller.ts`: NestJS HTTP controller for `GET /habit-memory`.
- `packages/habit-memory/src/presentation/controllers/index.ts`: Barrel export for controllers.
- `packages/habit-memory/src/presentation/index.ts`: Barrel export for presentation.
- `packages/habit-memory/src/habit-memory.module.ts`: NestJS module declaration wiring controller and providers.
- `packages/habit-memory/src/index.ts`: Public package API entry point.

### 2.2 Data Models, Interfaces, and Contracts
- Abstract interfaces:
  - `HabitMemoryStore`: `{ get, save }`
  - `EntryRepository`: `{ listRecent }` (consumed from `@journ/entries`)
  - `AIProvider`: `{ deriveHabitMemory }` (consumed from `@journ/common`)
- Domain exceptions imported from `@journ/common`:
  - `ValidationError`

### 2.3 Dependencies
- `@journ/common`: Workspace package dependency for domain errors and AI contracts.
- `@journ/entries`: Workspace package dependency for `EntryRepository` contract and `EntriesModule`.
- Root hoisted dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/schedule`, `firebase-admin`, `reflect-metadata`.
- Zero new external packages will be added.

### 2.4 Risks & Trade-offs
- **Risk:** Circular package dependencies between `@journ/habit-memory` and other packages.
  - **Mitigation:** Strict Directed Acyclic Graph (DAG): `@journ/habit-memory` -> `@journ/entries` -> `@journ/common`. No reverse dependencies exist.
- **Risk:** TypeScript cross-package TS6059 composite boundary issues.
  - **Mitigation:** Rely on workspace package resolution (`packages/entries/dist/` and `packages/common/dist/`) via node_modules rather than cross-package relative path aliases.

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Domain & Interfaces) | `packages/habit-memory/test/services/habit-memory.service.spec.ts` |
| `REQ-2` (Domain Service) | `packages/habit-memory/test/services/habit-memory.service.spec.ts` |
| `REQ-3` (Infrastructure Store & Cron) | `packages/habit-memory/test/infrastructure/repositories/firestore-habit-memory.store.spec.ts`<br>`packages/habit-memory/test/infrastructure/jobs/habit-memory.cron.spec.ts` |
| `REQ-4` (Presentation Controller) | `packages/habit-memory/test/presentation/controllers/habit-memory.controller.spec.ts` |
| `REQ-5` (Module Wiring) | `packages/habit-memory/test/habit-memory.module.spec.ts` |
| `REQ-6` (Independent Build & Test) | `npm run build -w @journ/habit-memory` & `npm test -w @journ/habit-memory` |
| `REQ-7` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites (172 tests) |

---

## 3. Tasks

- [x] **Task 1: Implement Domain Models & Persistence Contracts (`REQ-1`)**
  - Create `packages/habit-memory/src/domain/` (`habit-memory.ts`, `index.ts`).
  - Create `packages/habit-memory/src/interfaces/` (`habit-memory-store.interface.ts`, `index.ts`).
  - *Done when:* All domain models and persistence contracts exist and export cleanly with zero external peer package imports.

- [x] **Task 2: Implement Habit Memory Domain Service (`REQ-2`)**
  - Create `packages/habit-memory/src/services/habit-memory.service.ts` with validation, rolling 30-day lookback, fallback defaults, AI derivation, and persistence.
  - Create `packages/habit-memory/src/services/index.ts`.
  - *Done when:* `npm test -w @journ/habit-memory packages/habit-memory/test/services` passes all 11 unit tests green.

- [x] **Task 3: Implement Cloud Infrastructure Adapters & Jobs (`REQ-3`)**
  - Create `packages/habit-memory/src/infrastructure/repositories/firestore-habit-memory.store.ts`.
  - Create `packages/habit-memory/src/infrastructure/jobs/habit-memory.cron.ts`.
  - Create barrel exports in `infrastructure/repositories/index.ts`, `infrastructure/jobs/index.ts`, and `infrastructure/index.ts`.
  - *Done when:* `npm test -w @journ/habit-memory packages/habit-memory/test/infrastructure` passes all 6 tests (3 store, 3 cron) green.

- [x] **Task 4: Implement Presentation Controller (`REQ-4`)**
  - Create `packages/habit-memory/src/presentation/controllers/habit-memory.controller.ts` with null fallback handling.
  - Create barrel exports in `presentation/controllers/index.ts` and `presentation/index.ts`.
  - *Done when:* `npm test -w @journ/habit-memory packages/habit-memory/test/presentation` passes both controller unit tests green.

- [x] **Task 5: Wire NestJS Module and Public Package Entry Point (`REQ-5`)**
  - Create `packages/habit-memory/src/habit-memory.module.ts` registering controllers, providers, factory injection, and exports.
  - Create `packages/habit-memory/src/index.ts` exporting public package symbols.
  - *Done when:* `npm test -w @journ/habit-memory packages/habit-memory/test/habit-memory.module.spec.ts` passes integration test green.

- [x] **Task 6: Validate Independent Package Build and Full Test Suite Execution (`REQ-6`)**
  - Run `npm run build -w @journ/habit-memory`.
  - Run `npm test -w @journ/habit-memory`.
  - *Done when:* TypeScript compiles cleanly with 0 errors to `packages/habit-memory/dist/` and all 5 staged test suites (20 tests) pass 100% green.

- [x] **Task 7: Verify Monolith Non-Interference (`REQ-7`)**
  - Run `git status -s` to verify zero modified files in `src/` or `frontend/`.
  - Run `npm test` across root workspace.
  - *Done when:* Root test runner executes all 32 legacy test suites (172 tests) with 100% pass rate.
