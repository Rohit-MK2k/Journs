# Parallel Monorepo Migration Phase 2 (Part 2) — Spec Memory

- **Spec Document:** `Documentation/Specs/parallel-monorepo-migration-phase2-002.md`
- **Target:** `packages/account/src/`, `packages/account/dist/`
- **Date:** 2026-10-28
- **Status:** Implemented

---

## 1. Summary of Steps Taken

1. **Domain & Purge Contract Interfaces (`REQ-1`):**
   - Created `packages/account/src/interfaces/account-repository.interface.ts` defining `AccountRepository`.
   - Created `packages/account/src/interfaces/auth-provider.interface.ts` defining `AuthProvider`.
   - Created `packages/account/src/interfaces/purge-dependencies.interface.ts` defining `EntryRepositoryPurge` and `VectorSearchPurge`.
   - Created `packages/account/src/interfaces/index.ts` re-exporting all contract interfaces.

2. **Account Service Implementation (`REQ-2`):**
   - Created `packages/account/src/services/account.service.ts` implementing `AccountService` with input validation (`ValidationError` from `@journ/common`) and sequential cascading deletion order (`entryRepo.deleteAll` -> `vectorSearch.removeAll` -> `accountRepo.deleteUserDocument` -> `authProvider.deleteAccount`).
   - Created `packages/account/src/services/index.ts`.
   - Verified via `npm test -w @journ/account packages/account/test/services/account.service.spec.ts` (2/2 tests passed).

3. **Cloud Infrastructure Adapters (`REQ-3`):**
   - Created `packages/account/src/infrastructure/repositories/firestore-account.repository.ts` implementing `AccountRepository` via `getFirestore().collection('users').doc(uid).delete()`.
   - Created `packages/account/src/infrastructure/providers/firebase-auth.provider.ts` implementing `AuthProvider` via `getAuth().deleteUser(uid)`.
   - Created barrel files in `repositories/`, `providers/`, and `infrastructure/index.ts`.
   - Verified via `npm test -w @journ/account packages/account/test/infrastructure` (2 suites, 2/2 tests passed).

4. **Presentation Controller (`REQ-4`):**
   - Created `packages/account/src/presentation/controllers/account.controller.ts` implementing `AccountController` with `DELETE /account` invoking `wipeUserData` and `PATCH /account/settings` returning updated settings.
   - Created barrel files in `controllers/` and `presentation/index.ts`.
   - Verified via `npm test -w @journ/account packages/account/test/presentation/controllers/account.controller.spec.ts` (2/2 tests passed).

5. **NestJS Module & Public API Wiring (`REQ-5`):**
   - Created `packages/account/src/account.module.ts` declaring `AccountModule` with `AccountController`, `'AccountRepository'`, `'AuthProvider'`, and factory provider for `AccountService` injecting tokens with optional resolution for cascade dependencies.
   - Created `packages/account/src/index.ts` exporting public package symbols.
   - Created `packages/account/test/setup.ts` mocking Firebase Admin SDK singletons globally for isolated unit testing, and configured `setupFiles` in `packages/account/jest.config.js`.
   - Verified via `npm test -w @journ/account packages/account/test/account.module.spec.ts` (1/1 test passed).

6. **Independent Package Build and Full Test Suite Execution (`REQ-6`):**
   - Executed `npm run build -w @journ/account` (`tsc`) producing clean `.js`, `.d.ts`, and `.map` files in `packages/account/dist/`.
   - Executed `npm test -w @journ/account` verifying all 5 test suites (7/7 tests) pass 100% green.

7. **Monolith Non-Interference Verification (`REQ-7`):**
   - Checked `git status -s` confirming zero modifications in `src/` or `frontend/`.
   - Executed root `npm test` verifying all 32 legacy test suites (172/172 tests) pass.

---

## 2. Decisions & Rationale

- **Decoupled Purge Contracts & Optional DI Tokens:** In the legacy monolith, `AccountService` and `AccountModule` held a hard compile-time dependency on `src/entries/`. By introducing `EntryRepositoryPurge` and `VectorSearchPurge` interfaces and configuring factory tokens in `AccountModule` with `{ optional: true }`, `@journ/account` operates as an independent bounded context without peer implementation coupling prior to Phase 3.
- **Global Test Setup for Firebase Admin Mocks:** Requiring `@journ/common` indirectly touches `firebase-admin/auth`, which brings in ESM dependencies (`jose`). Adding `packages/account/test/setup.ts` to mock Firebase Admin SDK prevents un-mocked native network initialization across isolated unit tests.
- **TypeScript Path Scoping:** Removed cross-package `../common/src/*` path mapping from `packages/account/tsconfig.json` to prevent `tsc` from violating `rootDir` boundaries, allowing `@journ/common` to resolve normally through workspace hoisting (`packages/common/dist/`).

---

## 3. Deviations from the Spec

None. All 7 tasks were implemented and verified according to the approved Plan and Tasks.

---

## 4. Verification Evidence

### 4.1 Independent Package Build (`npm run build -w @journ/account`)
```text
> @journ/account@0.1.0 build
> tsc
```
Exit code: 0. Compiled `packages/account/src/` to `packages/account/dist/`.

### 4.2 Independent Package Test Suite (`npm test -w @journ/account`)
```text
Test Suites: 5 passed, 5 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        20.228 s
Ran all test suites.
```
All 5 test suites passed:
- `test/infrastructure/repositories/firestore-account.repository.spec.ts` (1 test passed)
- `test/infrastructure/providers/firebase-auth.provider.spec.ts` (1 test passed)
- `test/presentation/controllers/account.controller.spec.ts` (2 tests passed)
- `test/services/account.service.spec.ts` (2 tests passed)
- `test/account.module.spec.ts` (1 test passed)

### 4.3 Monolith Regression Test Suite (`npm test`)
```text
Test Suites: 32 passed, 32 total
Tests:       172 passed, 172 total
Snapshots:   0 total
Time:        33.121 s
Ran all test suites.
```
All 32 test suites passed with zero regressions.

### 4.4 Workspace Isolation Check (`git status -s`)
```text
 M package-lock.json
?? Documentation/Specs/Memory/parallel-monorepo-migration-phase2-001.md
?? Documentation/Specs/Memory/parallel-monorepo-migration-phase2-002.md
?? Documentation/Specs/parallel-monorepo-migration-phase2-001.md
?? Documentation/Specs/parallel-monorepo-migration-phase2-002.md
?? packages/account/dist/
?? packages/account/jest.config.js
?? packages/account/package.json
?? packages/account/src/
?? packages/account/test/
?? packages/account/tsconfig.json
```
Zero files in `src/` or `frontend/` were modified.

---

## 5. Failures & Dead Ends

- **TypeScript TS6059 `rootDir` Boundary:** An initial configuration in `packages/account/tsconfig.json` mapped `@journ/common/*` to `../common/src/*`. When running `tsc`, TypeScript attempted to include `../common/src/` files within `@journ/account`'s `rootDir`, failing with TS6059. Rectified by removing the external path alias so `@journ/common` resolves directly via workspace package declarations (`packages/common/dist/`).
- **Jest ESM Token Error (`jose` via `firebase-admin/auth`):** When importing `@journ/common`, its barrel export triggers `firebase-auth.guard.ts` which loads `firebase-admin/auth` and `jose` (ESM). Resolved by configuring `packages/account/test/setup.ts` to mock Firebase Admin SDK singletons globally during package test execution.

---

## 6. Known Issues & Follow-ups

- Legacy monolith test runner continues to report an ungraceful worker exit due to active timers in legacy cron tests:
  `A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown.`
  This is a pre-existing condition in legacy `src/` and did not impact test correctness.
- Phase 2 of the migration plan is now 100% complete. The monorepo is ready for Phase 3: Core Domain Extraction — `@journ/entries`.
