# Parallel Monorepo Migration Phase 2 (Part 1) — `@journ/account` Test Suite Specification
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-10-27

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 2 of the Parallel Monorepo Migration Plan extracts the Account domain from the legacy monolith (`src/account/`) into an isolated workspace package (`packages/account/`). 

Following the Spec-Driven Development (SDD) paradigm and the Strangler Fig pattern established in Phase 1, Phase 2 is partitioned into two distinct stages:
- **Part 1 (this specification):** Scaffolding workspace configuration (`package.json`, `tsconfig.json`, `jest.config.js`) and staging decoupled test suites in `packages/account/test/` with comprehensive assertions, standardized metadata annotations, and strict directory mirroring of `src/`.
- **Part 2 (subsequent specification):** Implementing production classes in `packages/account/src/`, resolving test dependencies, verifying independent builds, and proving zero regressions in the legacy monolith.

The goal of this Part 1 spec is to define the test runner environment and explicit test cases for `@journ/account` in total isolation, preventing test contamination of the root monolith runner.

### 1.2 Scope
- **In Scope:**
  - Workspace package manifest for `packages/account/package.json` declaring `@journ/account` with dedicated `build` and `test` scripts.
  - TypeScript compiler configuration in `packages/account/tsconfig.json` extending root `tsconfig.base.json`.
  - Isolated Jest configuration in `packages/account/jest.config.js` scoped strictly to `<rootDir>/test`.
  - Directory structure mirroring: `packages/account/test/` must strictly mirror the subfolder structure of `packages/account/src/` established for Part 2 (`services/`, `presentation/controllers/`, `infrastructure/repositories/`, `infrastructure/providers/`).
  - Staging decoupled unit test suites for:
    - Account service: cascading data wipe and validation (`test/services/account.service.spec.ts`).
    - Account presentation controller: delete account and update settings (`test/presentation/controllers/account.controller.spec.ts`).
    - Firestore account repository: user document deletion (`test/infrastructure/repositories/firestore-account.repository.spec.ts`).
    - Firebase authentication provider: account deletion via Firebase Admin Auth (`test/infrastructure/providers/firebase-auth.provider.spec.ts`).
  - Staging integration test suite for:
    - NestJS module container: DI wiring and provider resolution (`test/account.module.spec.ts`).
  - Standardizing test classification and intent via mandatory JSDoc block headers (`@testType`, `@target`, `@description`) matching Phase 1 Part 1 format.

- **Explicitly Out of Scope:**
  - Implementing production classes under `packages/account/src/` (deferred strictly to Part 2).
  - Modifying or deleting any file within legacy `src/` or `frontend/`.
  - Modifying `@journ/common` or introducing dependencies on peer feature packages (`entries`, `habit-memory`, `chat`, `cron`).

### 1.3 Requirements
- **`REQ-1` Package Configuration & Test Runner Isolation:**
  - `packages/account/package.json` must configure `@journ/account` as a private workspace package with dependencies on `@journ/common` (`*`) and required peer dev dependencies.
  - `packages/account/jest.config.js` must restrict test discovery strictly to `roots: ['<rootDir>/test']` with module aliases mapping `@journ/account/(.*)` to `<rootDir>/src/$1` and `@journ/account` to `<rootDir>/src/index`.
  - Root `jest.config.js` (`roots: ['<rootDir>/src']`) must remain completely insulated from `packages/account/test/`.

- **`REQ-2` Strict Directory Layout Mirroring:**
  - The directory hierarchy of `packages/account/test/` must strictly mirror `packages/account/src/` (as implemented in Part 2).
  - Every test file must reside in the exact mirrored path corresponding to its future production target file (e.g. `src/services/account.service.ts` -> `test/services/account.service.spec.ts`).

- **`REQ-3` Account Service Test Suite (`test/services/account.service.spec.ts`):**
  - Must define unit tests for `AccountService.wipeUserData(uid)`.
  - Must assert rejection with `ValidationError` when `uid` is empty or whitespace-only.
  - Must verify that user data wipe executes the required cascade calls across all collaborators:
    1. Entry repository purge: `entryRepo.deleteAll(uid)`
    2. Vector search purge: `vectorSearch.removeAll(uid)`
    3. Firestore user document deletion: `accountRepo.deleteUserDocument(uid)`
    4. Auth account deletion: `authProvider.deleteAccount(uid)`
  - Collaborators must be mocked interfaces adhering to Dependency Inversion without referencing peer package concrete classes.

- **`REQ-4` Account Controller Test Suite (`test/presentation/controllers/account.controller.spec.ts`):**
  - Must define unit tests for `AccountController` methods:
    - `deleteAccount`: verifies `accountService.wipeUserData(req.user.uid)` is invoked and returns `{ uid, status: 'success', message: 'Account deleted' }`.
    - `updateSettings`: verifies returns `{ uid: req.user.uid, status: 'success', updatedSettings }`.

- **`REQ-5` Firestore Repository Test Suite (`test/infrastructure/repositories/firestore-account.repository.spec.ts`):**
  - Must define unit tests for `FirestoreAccountRepository.deleteUserDocument(uid)`.
  - Must verify that `getFirestore().collection('users').doc(uid).delete()` is called with the target `uid`.

- **`REQ-6` Firebase Auth Provider Test Suite (`test/infrastructure/providers/firebase-auth.provider.spec.ts`):**
  - Must define unit tests for `FirebaseAuthProvider.deleteAccount(uid)`.
  - Must verify that `getAuth().deleteUser(uid)` is called with the target `uid`.

- **`REQ-7` Account Module Integration Test Suite (`test/account.module.spec.ts`):**
  - Must define integration test using `@nestjs/testing` (`Test.createTestingModule`).
  - Must verify that `AccountModule` compiles and resolves `AccountController`, `AccountService`, `AccountRepository`, and `AuthProvider`.
  - External dependencies (`EntryRepository`, `VectorSearchProvider`) must be satisfied via mock provider definitions.

- **`REQ-8` Structured Test Documentation & Classification:**
  - Every test block across all suites must include a structured JSDoc comment matching the exact Phase 1 standard:
    - `@testType`: strictly `Unit Test` or `Integration Test`.
    - `@target`: specific class, function, or module under test.
    - `@description`: clear explanation of the scenario and expected outcome.

- **`REQ-9` Monolith Non-Interference:**
  - Running root `npm test` must continue executing legacy monolith tests in `src/` with 100% pass rate.
  - Zero files within `src/` or `frontend/` may be added, edited, or removed.

### 1.4 Acceptance Criteria
- **`AC-1` (Runner Isolation):** Running `npm test` at workspace root discovers and runs only legacy monolith tests (`src/`), ignoring `packages/account/test/`.
- **`AC-2` (Directory Mirroring):** `packages/account/test/` structure matches `packages/account/src/` path-for-path across all subdirectories (`services/`, `presentation/controllers/`, `infrastructure/repositories/`, `infrastructure/providers/`).
- **`AC-3` (Service Tests):** `test/services/account.service.spec.ts` specifies tests covering empty `uid` validation and mock verification of cascading deletion across all 4 purge operations.
- **`AC-4` (Controller Tests):** `test/presentation/controllers/account.controller.spec.ts` specifies tests for `deleteAccount` and `updateSettings`.
- **`AC-5` (Repository Tests):** `test/infrastructure/repositories/firestore-account.repository.spec.ts` specifies tests verifying Firestore document deletion on collection `users`.
- **`AC-6` (Auth Provider Tests):** `test/infrastructure/providers/firebase-auth.provider.spec.ts` specifies tests verifying Firebase Admin Auth user deletion.
- **`AC-7` (Module Wiring):** `test/account.module.spec.ts` specifies integration test compiling `AccountModule` and resolving its providers and controllers.
- **`AC-8` (Metadata Compliance):** 100% of test cases in `packages/account/test/` contain `@testType`, `@target`, and `@description` JSDoc annotations.
- **`AC-9` (Non-Interference):** `git status -s` shows 0 modified files in `src/` or `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Directory Mirroring & Test Layout Specification

#### 1.5.1 Structural Mirroring Map
The `test/` layout must replicate the internal folder hierarchy of `src/` 1:1:

```text
packages/account/
├── src/                                              # (Part 2 Implementation Target)
│   ├── infrastructure/
│   │   ├── providers/
│   │   │   └── firebase-auth.provider.ts
│   │   └── repositories/
│   │       └── firestore-account.repository.ts
│   ├── interfaces/
│   │   ├── account-repository.interface.ts
│   │   ├── auth-provider.interface.ts
│   │   └── index.ts
│   ├── presentation/
│   │   └── controllers/
│   │       └── account.controller.ts
│   ├── services/
│   │   └── account.service.ts
│   ├── account.module.ts
│   └── index.ts
└── test/                                             # (Part 1 Staging Target)
    ├── infrastructure/
    │   ├── providers/
    │   │   └── firebase-auth.provider.spec.ts        # Mirrors src/infrastructure/providers/
    │   └── repositories/
    │       └── firestore-account.repository.spec.ts  # Mirrors src/infrastructure/repositories/
    ├── presentation/
    │   └── controllers/
    │       └── account.controller.spec.ts            # Mirrors src/presentation/controllers/
    ├── services/
    │   └── account.service.spec.ts                   # Mirrors src/services/
    └── account.module.spec.ts                        # Mirrors src/account.module.ts
```

#### 1.5.2 Test Code Commenting Syntax (Matching Phase 1 Format)
Every test block must be preceded by a JSDoc block:
```typescript
/**
 * @testType Unit Test
 * @target AccountService.wipeUserData
 * @description Verifies that wiping user data triggers cascading deletion across entries, vector search index, firestore user document, and auth account in sequence.
 */
it('should cascade delete user data in the correct order', async () => { ... });
```

For module integration tests:
```typescript
/**
 * @testType Integration Test
 * @target AccountModule
 * @description Verifies that the NestJS DI container compiles AccountModule and successfully resolves the controller, service, and infrastructure providers.
 */
it('should compile AccountModule and resolve controllers and providers', async () => { ... });
```

#### 1.5.3 Test Suites Breakdown
1. **`test/services/account.service.spec.ts` (`[Unit Test]`):**
   - Case 1: `should cascade delete user data in the correct order` — asserts `entryRepo.deleteAll`, `vectorSearch.removeAll`, `accountRepo.deleteUserDocument`, and `authProvider.deleteAccount` are each invoked with `uid`.
   - Case 2: `should throw validation error if uid is empty` — asserts rejection with `ValidationError` for `''` and `'   '`.
2. **`test/presentation/controllers/account.controller.spec.ts` (`[Unit Test]`):**
   - Case 1: `should call wipeUserData on deleteAccount` — asserts `accountService.wipeUserData('u1')` is called and payload has `status: 'success'`.
   - Case 2: `should return updated settings on updateSettings` — asserts settings payload echo and `status: 'success'`.
3. **`test/infrastructure/repositories/firestore-account.repository.spec.ts` (`[Unit Test]`):**
   - Case 1: `should delete user document from firestore` — asserts `getFirestore().collection('users').doc(uid).delete()` is called.
4. **`test/infrastructure/providers/firebase-auth.provider.spec.ts` (`[Unit Test]`):**
   - Case 1: `should delete user auth record` — asserts `getAuth().deleteUser(uid)` is called.
5. **`test/account.module.spec.ts` (`[Integration Test]`):**
   - Case 1: `should compile AccountModule and resolve controllers and providers` — asserts module compilation and resolution of `AccountController`, `AccountService`, `'AccountRepository'`, and `'AuthProvider'`.

### 1.6 Edge Cases & Failure Modes
- **Peer Package Leakage:** In the legacy monolith, `AccountService` and `AccountModule` import directly from `src/entries/`. In `@journ/account`, test mocks must decouple from `src/entries/` by using standalone mock interface definitions to uphold Dependency Inversion.
- **Premature Production Implementation:** Generating `packages/account/src/` files during Part 1 violates the two-part staging separation (as encountered and rectified in Phase 1 Part 1). Production implementation must remain deferred to Part 2.
- **Jest Worker Teardown:** Pre-existing ungraceful worker exit warnings in the legacy cron runner must not be mistaken for regression caused by `@journ/account`.

### 1.7 Assumptions & Open Questions
- **Assumption:** Third-party libraries (`@nestjs/common`, `@nestjs/testing`, `firebase-admin`) are already installed and hoisted from the root `node_modules`.
- **Assumption:** Shared base configuration files (`tsconfig.base.json`) and foundation package (`@journ/common`) are in place and available.
- **Open Questions:** None. Staged test suites mirror the functionality of `src/account/` while enforcing strict boundary decoupling.

---

## 2. Plan (How)

### 2.1 Files and Components to Add
- `packages/account/package.json`: Private workspace package definition declaring `@journ/account`, scripts (`build`, `test`), and dependency on `@journ/common`.
- `packages/account/tsconfig.json`: TypeScript configuration extending `../../tsconfig.base.json` targeting `<rootDir>/test` and `<rootDir>/src`.
- `packages/account/jest.config.js`: Dedicated Jest configuration file scoped strictly to `<rootDir>/test`.
- `packages/account/test/services/account.service.spec.ts`: Unit tests for `AccountService` mirroring `src/services/`.
- `packages/account/test/presentation/controllers/account.controller.spec.ts`: Unit tests for `AccountController` mirroring `src/presentation/controllers/`.
- `packages/account/test/infrastructure/repositories/firestore-account.repository.spec.ts`: Unit tests for `FirestoreAccountRepository` mirroring `src/infrastructure/repositories/`.
- `packages/account/test/infrastructure/providers/firebase-auth.provider.spec.ts`: Unit tests for `FirebaseAuthProvider` mirroring `src/infrastructure/providers/`.
- `packages/account/test/account.module.spec.ts`: Integration test for `AccountModule` mirroring `src/account.module.ts`.

### 2.2 Data Models, Interfaces, and Contracts
- Mocks defined within test files will implement decoupled interface contracts:
  - `AccountRepository`: `{ deleteUserDocument(uid: string): Promise<void> }`
  - `AuthProvider`: `{ deleteAccount(uid: string): Promise<void> }`
  - `EntryRepositoryPurge`: `{ deleteAll(uid: string): Promise<void> }`
  - `VectorSearchPurge`: `{ removeAll(uid: string): Promise<void> }`
- Errors imported from `@journ/common`: `ValidationError`.

### 2.3 Dependencies
- `@journ/common`: workspace dependency for shared error classes (`ValidationError`).
- Root hoisted dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/testing`, `firebase-admin`, `jest`, `ts-jest`, `typescript`.
- Zero new external packages required.

### 2.4 Risks & Trade-offs
- **Risk:** Root Jest runner inadvertently discovering and executing tests in `packages/account/test/`.
  - **Mitigation:** Verified root `jest.config.js` sets `roots: ['<rootDir>/src']`, preventing discovery of package directories.
- **Risk:** Premature generation of `packages/account/src/` to resolve test import types.
  - **Mitigation:** Restricting Part 1 strictly to `packages/account/package.json`, `tsconfig.json`, `jest.config.js`, and `test/`. Production files remain deferred to Part 2.

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Runner Isolation) | Execution of root `npm test` verifying 0 package tests executed |
| `REQ-2` (Directory Mirroring) | Inspection of `packages/account/test/` directory hierarchy |
| `REQ-3` (Account Service) | `packages/account/test/services/account.service.spec.ts` |
| `REQ-4` (Account Controller) | `packages/account/test/presentation/controllers/account.controller.spec.ts` |
| `REQ-5` (Firestore Repository) | `packages/account/test/infrastructure/repositories/firestore-account.repository.spec.ts` |
| `REQ-6` (Firebase Auth Provider) | `packages/account/test/infrastructure/providers/firebase-auth.provider.spec.ts` |
| `REQ-7` (Account Module Wiring) | `packages/account/test/account.module.spec.ts` |
| `REQ-8` (Comment Standards) | Verification of `@testType`, `@target`, `@description` across all test files |
| `REQ-9` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites (172 tests) |

---

## 3. Tasks

- [x] **Task 1: Scaffold Package Configuration & Runner Isolation (`REQ-1`)**
  - Create `packages/account/package.json`, `packages/account/tsconfig.json`, and `packages/account/jest.config.js`.
  - *Done when:* `packages/account/jest.config.js` is isolated to `<rootDir>/test` and `npm test` at workspace root ignores `packages/account/`.

- [x] **Task 2: Stage Mirrored Directory Structure & Account Service Unit Tests (`REQ-2`, `REQ-3`, `REQ-8`)**
  - Create `packages/account/test/services/account.service.spec.ts` with test cases for empty `uid` validation and cascading deletion sequence across entries, vector index, firestore, and auth.
  - *Done when:* File exists under `packages/account/test/services/` with all test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 3: Stage Account Controller Unit Tests (`REQ-2`, `REQ-4`, `REQ-8`)**
  - Create `packages/account/test/presentation/controllers/account.controller.spec.ts` with test cases for `deleteAccount` and `updateSettings`.
  - *Done when:* File exists under `packages/account/test/presentation/controllers/` with all test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 4: Stage Infrastructure Unit Tests (`REQ-2`, `REQ-5`, `REQ-6`, `REQ-8`)**
  - Create `packages/account/test/infrastructure/repositories/firestore-account.repository.spec.ts` verifying document deletion.
  - Create `packages/account/test/infrastructure/providers/firebase-auth.provider.spec.ts` verifying auth deletion.
  - *Done when:* Both files exist under `packages/account/test/infrastructure/` with all test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 5: Stage Module Integration Test (`REQ-2`, `REQ-7`, `REQ-8`)**
  - Create `packages/account/test/account.module.spec.ts` testing `AccountModule` DI container compilation and provider resolution.
  - *Done when:* File exists directly under `packages/account/test/` with test case annotated with `@testType Integration Test`, `@target`, and `@description`.

- [x] **Task 6: Audit Test Code Commenting & Structural Mirroring Compliance (`REQ-2`, `REQ-8`)**
  - Review all staged test files in `packages/account/test/` to confirm 100% compliance with Phase 1 comment syntax (`@testType`, `@target`, `@description`) and exact 1:1 path mirroring against future `src/`.
  - *Done when:* Zero test cases in `packages/account/test/` are missing standard JSDoc classification blocks, and all 5 test paths match their `src/` counterparts.

- [x] **Task 7: Verify Monolith Non-Interference (`REQ-9`)**
  - Run `git status -s` to verify zero modified files in `src/` or `frontend/`.
  - Run `npm test` across root workspace.
  - *Done when:* Root test runner executes all 32 legacy test suites (172 tests) with 100% pass rate.
