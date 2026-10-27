# Parallel Monorepo Migration Phase 2 (Part 2) — `@journ/account` Production Code Extraction
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-10-27

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 2 Part 1 (`Documentation/Specs/parallel-monorepo-migration-phase2-001.md`) scaffolded the package configuration (`package.json`, `tsconfig.json`, `jest.config.js`) and staged 5 decoupled unit/integration test suites in `packages/account/test/`.

The goal of Phase 2 Part 2 is to extract and implement the production code in `packages/account/src/` to satisfy the staged test suite, enable independent package build/test execution, and uphold strict Domain-Driven Design (DDD) layer separation and Dependency Inversion.

Under the Strangler Fig pattern, the legacy monolith in `src/account/` remains completely untouched and continues functioning without modification or regression.

### 1.2 Scope
- **In Scope:**
  - Defining domain and purge contracts in `packages/account/src/interfaces/`:
    - `account-repository.interface.ts`: persistence contract for deleting user records.
    - `auth-provider.interface.ts`: auth provider contract for deleting user credentials.
    - `purge-dependencies.interface.ts`: abstract contracts for cascade purge operations (`EntryRepositoryPurge`, `VectorSearchPurge`).
    - `index.ts`: barrel export for interfaces.
  - Extracting business logic in `packages/account/src/services/`:
    - `account.service.ts`: `AccountService` coordinating ordered cascade user data wipe (`wipeUserData`) and input validation.
    - `index.ts`: barrel export for services.
  - Extracting cloud infrastructure adapters in `packages/account/src/infrastructure/`:
    - `repositories/firestore-account.repository.ts`: `FirestoreAccountRepository` implementing `AccountRepository`.
    - `providers/firebase-auth.provider.ts`: `FirebaseAuthProvider` implementing `AuthProvider`.
    - `index.ts`: barrel export for infrastructure.
  - Extracting presentation components in `packages/account/src/presentation/`:
    - `controllers/account.controller.ts`: `AccountController` handling `DELETE /account` and `PATCH /account/settings`.
    - `index.ts`: barrel export for presentation.
  - Wiring NestJS module and public package API in:
    - `packages/account/src/account.module.ts`: `AccountModule` configuring DI tokens and providers.
    - `packages/account/src/index.ts`: root package barrel export.
  - Independent build verification (`npm run build -w @journ/account`) emitting clean JavaScript and type declarations to `packages/account/dist/`.
  - Independent test execution (`npm test -w @journ/account`) verifying all 5 staged test suites pass 100% green.
  - Monolith non-interference verification (`npm test`).

- **Explicitly Out of Scope:**
  - Modifying or deleting any file within legacy `src/` or `frontend/`.
  - Modifying the staged test files in `packages/account/test/`.
  - Extracting domain feature packages (`@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron` — Phase 3+).
  - Wiring composition roots in `apps/` (Phase 6+).

### 1.3 Requirements
- **`REQ-1` Domain & Purge Contract Interfaces:**
  - `packages/account/src/interfaces/` must define abstract interfaces for:
    - `AccountRepository`: `{ deleteUserDocument(uid: string): Promise<void> }`.
    - `AuthProvider`: `{ deleteAccount(uid: string): Promise<void> }`.
    - `EntryRepositoryPurge`: `{ deleteAll(uid: string): Promise<void> }`.
    - `VectorSearchPurge`: `{ removeAll(uid: string): Promise<void> }`.
  - Interfaces must not import or depend on any code outside `@journ/account` or `@journ/common`.

- **`REQ-2` Account Service Domain Logic:**
  - `packages/account/src/services/account.service.ts` must implement `AccountService`:
    - Must validate `uid` and throw `ValidationError` (from `@journ/common`) if empty or whitespace-only.
    - Must execute cascading data wipe in strict sequential order:
      1. `entryRepo.deleteAll(uid)`
      2. `vectorSearch.removeAll(uid)`
      3. `accountRepo.deleteUserDocument(uid)`
      4. `authProvider.deleteAccount(uid)`
    - Dependencies must be injected through abstract interface contracts or DI tokens (`AccountRepository`, `AuthProvider`, `EntryRepository`, `VectorSearchProvider`).

- **`REQ-3` Cloud Infrastructure Adapters:**
  - `packages/account/src/infrastructure/repositories/firestore-account.repository.ts` must implement `FirestoreAccountRepository`:
    - Must implement `AccountRepository`.
    - Must delete the user document at `getFirestore().collection('users').doc(uid).delete()`.
  - `packages/account/src/infrastructure/providers/firebase-auth.provider.ts` must implement `FirebaseAuthProvider`:
    - Must implement `AuthProvider`.
    - Must delete the user auth record via `getAuth().deleteUser(uid)`.

- **`REQ-4` Presentation Controller:**
  - `packages/account/src/presentation/controllers/account.controller.ts` must implement `AccountController`:
    - `@Controller('account')` with `@Delete()` deleting the authenticated user's account via `accountService.wipeUserData(req.user.uid)`.
    - `@Patch('settings')` returning updated settings payload.

- **`REQ-5` NestJS Module Wiring & Barrel Exports:**
  - `packages/account/src/account.module.ts` must declare `AccountModule`:
    - Registers `AccountController`.
    - Binds `'AccountRepository'` to `FirestoreAccountRepository`.
    - Binds `'AuthProvider'` to `FirebaseAuthProvider`.
    - Provides `AccountService` using a factory injecting tokens `['AccountRepository', 'AuthProvider', 'EntryRepository', 'VectorSearchProvider']`.
    - Exports `AccountService`, `'AccountRepository'`, and `'AuthProvider'`.
  - `packages/account/src/index.ts` must export public package symbols.

- **`REQ-6` Independent Package Build & Test Execution:**
  - `npm run build -w @journ/account` must execute `tsc` and output valid `.js`, `.d.ts`, and `.map` files into `packages/account/dist/` with zero TypeScript errors.
  - `npm test -w @journ/account` must execute all 5 staged test suites with 100% pass rate.

- **`REQ-7` Monolith Non-Interference:**
  - Zero files within `src/` or `frontend/` may be added, edited, or deleted.
  - Root `npm test` must continue passing all 32 legacy test suites (172 tests).

### 1.4 Acceptance Criteria
- **`AC-1` (Interfaces):** `packages/account/src/interfaces/index.ts` exports all contracts; no peer imports exist.
- **`AC-2` (Service):** `packages/account/test/services/account.service.spec.ts` passes all test cases (empty `uid` validation and ordered cascading deletion).
- **`AC-3` (Infrastructure):** `packages/account/test/infrastructure/repositories/firestore-account.repository.spec.ts` and `packages/account/test/infrastructure/providers/firebase-auth.provider.spec.ts` pass all test cases.
- **`AC-4` (Controller):** `packages/account/test/presentation/controllers/account.controller.spec.ts` passes `deleteAccount` and `updateSettings` test cases.
- **`AC-5` (Module):** `packages/account/test/account.module.spec.ts` passes DI compilation and provider resolution test cases.
- **`AC-6` (Independent Build & Test):** `npm run build -w @journ/account` exits code 0; `npm test -w @journ/account` runs 5 suites (7 tests) with 100% pass rate.
- **`AC-7` (Non-Interference):** `git status -s` shows 0 modified files in `src/` or `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Edge Cases & Failure Modes
- **Decoupled DI Resolution in Isolation:** In the legacy monolith, `AccountModule` directly imported `EntriesModule` to obtain `EntryRepository` and `VectorSearchProvider`. In `@journ/account`, `AccountService` factory injects `'EntryRepository'` and `'VectorSearchProvider'` tokens as optional or interface-bound providers so that `@journ/account` can compile and test without an immediate peer dependency on `@journ/entries`.
- **Cascading Wipe Failure:** If any step in `wipeUserData` throws an exception, subsequent steps are halted, preventing partial corruption from proceeding silently.
- **Whitespace Input Handling:** `wipeUserData` must validate not only empty string `''` but also whitespace-only strings `'   '` using `.trim()`.

### 1.6 Assumptions & Open Questions
- **Assumption:** Third-party libraries (`@nestjs/common`, `firebase-admin`, `@journ/common`) resolve via workspace hoisting.
- **Assumption:** No modifications are made to `src/` or staged tests in `packages/account/test/`.
- **Open Questions:** None. Staged test suites in `packages/account/test/` provide exact behavioral specifications.

---

## 2. Plan (How)

### 2.1 Files and Components to Add
- `packages/account/src/interfaces/account-repository.interface.ts`: Contract for user document deletion.
- `packages/account/src/interfaces/auth-provider.interface.ts`: Contract for user authentication deletion.
- `packages/account/src/interfaces/purge-dependencies.interface.ts`: Abstract contracts for cascading wipe dependencies (`EntryRepositoryPurge`, `VectorSearchPurge`).
- `packages/account/src/interfaces/index.ts`: Barrel export for all interfaces.
- `packages/account/src/services/account.service.ts`: Core domain service coordinating cascading user wipe.
- `packages/account/src/services/index.ts`: Barrel export for services.
- `packages/account/src/infrastructure/repositories/firestore-account.repository.ts`: Firestore persistence adapter implementing `AccountRepository`.
- `packages/account/src/infrastructure/repositories/index.ts`: Barrel export for repositories.
- `packages/account/src/infrastructure/providers/firebase-auth.provider.ts`: Firebase Admin Auth adapter implementing `AuthProvider`.
- `packages/account/src/infrastructure/providers/index.ts`: Barrel export for providers.
- `packages/account/src/infrastructure/index.ts`: Barrel export for infrastructure.
- `packages/account/src/presentation/controllers/account.controller.ts`: NestJS HTTP controller handling account operations.
- `packages/account/src/presentation/controllers/index.ts`: Barrel export for controllers.
- `packages/account/src/presentation/index.ts`: Barrel export for presentation.
- `packages/account/src/account.module.ts`: NestJS module declaration wiring controller and providers.
- `packages/account/src/index.ts`: Public package API entry point.

### 2.2 Data Models, Interfaces, and Contracts
- Abstract interfaces:
  - `AccountRepository`: `{ deleteUserDocument(uid: string): Promise<void> }`
  - `AuthProvider`: `{ deleteAccount(uid: string): Promise<void> }`
  - `EntryRepositoryPurge`: `{ deleteAll(uid: string): Promise<void> }`
  - `VectorSearchPurge`: `{ removeAll(uid: string): Promise<void> }`
- Domain exceptions:
  - `ValidationError` from `@journ/common`.

### 2.3 Dependencies
- `@journ/common`: Workspace package dependency for domain error classes.
- Project-level hoisted dependencies: `@nestjs/common`, `@nestjs/core`, `firebase-admin`, `reflect-metadata`.
- Zero new external packages will be added.

### 2.4 Risks & Trade-offs
- **Risk:** Type mismatch between legacy monolith parameters and new package contracts.
  - **Mitigation:** Interfaces match exact shapes expected by the staged tests in `packages/account/test/`.
- **Risk:** NestJS DI compilation failure when resolving injected tokens without `EntriesModule`.
  - **Mitigation:** In `AccountModule`, the factory provider uses injection tokens `['AccountRepository', 'AuthProvider', { token: 'EntryRepository', optional: true }, { token: 'VectorSearchProvider', optional: true }]` or explicit provider overrides in isolated test contexts.

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Interfaces) | `packages/account/test/services/account.service.spec.ts` |
| `REQ-2` (Account Service) | `packages/account/test/services/account.service.spec.ts` |
| `REQ-3` (Firestore Repository) | `packages/account/test/infrastructure/repositories/firestore-account.repository.spec.ts` |
| `REQ-3` (Firebase Auth Provider) | `packages/account/test/infrastructure/providers/firebase-auth.provider.spec.ts` |
| `REQ-4` (Account Controller) | `packages/account/test/presentation/controllers/account.controller.spec.ts` |
| `REQ-5` (Account Module) | `packages/account/test/account.module.spec.ts` |
| `REQ-6` (Independent Build & Test) | `npm run build -w @journ/account` & `npm test -w @journ/account` |
| `REQ-7` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites (172 tests) |

---

## 3. Tasks

- [x] **Task 1: Implement Domain & Purge Contract Interfaces (`REQ-1`)**
  - Create `packages/account/src/interfaces/account-repository.interface.ts`, `auth-provider.interface.ts`, `purge-dependencies.interface.ts`, and `index.ts`.
  - *Done when:* `packages/account/src/interfaces/index.ts` exists and exports all contract types with zero external peer package imports.

- [x] **Task 2: Implement Account Service Domain Logic (`REQ-2`)**
  - Create `packages/account/src/services/account.service.ts` and `index.ts`.
  - Validate `uid` against empty/whitespace strings throwing `ValidationError` from `@journ/common`.
  - Implement sequential cascade deletion: `entryRepo.deleteAll` -> `vectorSearch.removeAll` -> `accountRepo.deleteUserDocument` -> `authProvider.deleteAccount`.
  - *Done when:* `npm test -w @journ/account packages/account/test/services/account.service.spec.ts` passes 2/2 tests green.

- [x] **Task 3: Implement Cloud Infrastructure Adapters (`REQ-3`)**
  - Create `packages/account/src/infrastructure/repositories/firestore-account.repository.ts` implementing `AccountRepository`.
  - Create `packages/account/src/infrastructure/providers/firebase-auth.provider.ts` implementing `AuthProvider`.
  - Create barrel exports in `infrastructure/repositories/index.ts`, `infrastructure/providers/index.ts`, and `infrastructure/index.ts`.
  - *Done when:* `npm test -w @journ/account packages/account/test/infrastructure` passes 2/2 suites (2/2 tests) green.

- [x] **Task 4: Implement Presentation Controller (`REQ-4`)**
  - Create `packages/account/src/presentation/controllers/account.controller.ts` and `index.ts`.
  - Handle `DELETE /account` invoking `wipeUserData` and `PATCH /account/settings` returning updated settings payload.
  - *Done when:* `npm test -w @journ/account packages/account/test/presentation/controllers/account.controller.spec.ts` passes 2/2 tests green.

- [x] **Task 5: Wire NestJS Account Module and Public Package API (`REQ-5`)**
  - Create `packages/account/src/account.module.ts` registering `AccountController`, `'AccountRepository'`, `'AuthProvider'`, and `AccountService`.
  - Create `packages/account/src/index.ts` exporting public package symbols.
  - *Done when:* `npm test -w @journ/account packages/account/test/account.module.spec.ts` passes 1/1 integration test green.

- [x] **Task 6: Validate Independent Package Build and Full Test Suite (`REQ-6`)**
  - Run `npm run build -w @journ/account`.
  - Run `npm test -w @journ/account`.
  - *Done when:* TypeScript compiles cleanly with 0 errors to `packages/account/dist/` and all 5 staged test suites (7 tests) pass 100% green.

- [x] **Task 7: Verify Monolith Non-Interference (`REQ-7`)**
  - Run `git status -s` to verify zero modified files in `src/` or `frontend/`.
  - Run `npm test` across root workspace.
  - *Done when:* Root test runner executes all 32 legacy suites (172 tests) with 100% pass rate.
