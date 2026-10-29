# Parallel Monorepo Migration Phase 3 (Part 1) — Spec Memory

- **Spec Document:** `Documentation/Specs/parallel-monorepo-migration-phase3-001.md`
- **Target:** `packages/entries/package.json`, `packages/entries/tsconfig.json`, `packages/entries/jest.config.js`, `packages/entries/test/`
- **Date:** 2026-10-28
- **Status:** Implemented

---

## 1. Summary of Steps Taken

1. **Package Scaffolding & Workspace Linkage (`REQ-1`):**
   - Created `packages/entries/package.json` declaring private workspace package `@journ/entries` with `build` (`tsc`) and `test` (`jest --config jest.config.js`) scripts and dependency on `@journ/common` (`*`).
   - Created `packages/entries/tsconfig.json` extending root `../../tsconfig.base.json`.
   - Created `packages/entries/jest.config.js` isolating test discovery strictly to `<rootDir>/test` and configuring path mappings for `@journ/entries` and `@journ/common`.
   - Created `packages/entries/test/setup.ts` mocking Firebase Admin SDK singletons (`getFirestore`, `getAuth`).
   - Ran `npm install` at workspace root to register `@journ/entries` in npm workspaces (`npm query .workspace`).

2. **Domain Service Test Staging (`REQ-2` - `REQ-5`):**
   - Created `packages/entries/test/services/entry.service.spec.ts` (mirrors `src/services/entry.service.ts`), staging unit tests for entry CRUD, attachment associations, validation, and async vector indexing.
   - Created `packages/entries/test/services/semantic-search.service.spec.ts` (mirrors `src/services/semantic-search.service.ts`), staging unit tests for query embedding, vector distance scoring, and chip extraction.
   - Created `packages/entries/test/services/attachment-cleanup-cron.service.spec.ts` (mirrors `src/services/attachment-cleanup-cron.service.ts`), staging unit tests for 2:00 AM orphan garbage collection and resilient error handling.

3. **Presentation Controller & DTO Test Staging (`REQ-2`, `REQ-6`):**
   - Created `packages/entries/test/presentation/controllers/entries.controller.spec.ts` (mirrors `src/presentation/controllers/entries.controller.ts`), staging unit tests for entry endpoints, timeline retrieval, autosave, and attachment signed URLs.
   - Created `packages/entries/test/presentation/controllers/search.controller.spec.ts` (mirrors `src/presentation/controllers/search.controller.ts`), staging unit tests for semantic search queries and empty-string guards.
   - Created `packages/entries/test/presentation/dto/create-entry.dto.spec.ts` and `packages/entries/test/presentation/dto/update-entry.dto.spec.ts` (mirroring `src/presentation/dto/`), staging validation schema tests for entries and polymorphic attachments.

4. **Infrastructure Repository & Provider Test Staging (`REQ-2`, `REQ-7`):**
   - Created `packages/entries/test/infrastructure/repositories/firestore-entry.repository.spec.ts` (mirrors `src/infrastructure/repositories/firestore-entry.repository.ts`).
   - Created `packages/entries/test/infrastructure/repositories/firestore-pending-attachment.repository.spec.ts` (mirrors `src/infrastructure/repositories/firestore-pending-attachment.repository.ts`).
   - Created `packages/entries/test/infrastructure/providers/firestore-cosine-vector-search.provider.spec.ts` (mirrors `src/infrastructure/providers/firestore-cosine-vector-search.provider.ts`).
   - Created `packages/entries/test/infrastructure/providers/vertex-vector-search.provider.spec.ts` (mirrors `src/infrastructure/providers/vertex-vector-search.provider.ts`).

5. **Module Integration Test Staging (`REQ-2`, `REQ-8`):**
   - Created `packages/entries/test/entries.module.spec.ts` (mirrors `src/entries.module.ts`), staging DI compilation and provider resolution test with external contract stubs for `AIProvider`, `StorageProvider`, and `GENAI_CLIENT`.

6. **Metadata & Structural Mirroring Audit (`REQ-2`, `REQ-9`):**
   - Executed automated node audit verifying 100% of staged test cases (85 test cases across 12 files) include mandatory `@testType`, `@target`, and `@description` JSDoc annotations with 0 missing.
   - Confirmed 1:1 path mirroring against future production targets under `packages/entries/src/`.

7. **Monolith Non-Interference Verification (`REQ-10`):**
   - Verified `git status -s` confirmed zero modifications within `src/` or `frontend/`.
   - Executed root `npm test` verifying all 32 legacy test suites (172 tests) passed with 100% pass rate.

---

## 2. Decisions & Rationale

- **Rectifying Flat Legacy Test Placement:** In the legacy monolith, `entry.service.spec.ts` and `semantic-search.service.spec.ts` were located in a flat `src/entries/__tests__/` directory. To enforce strict 1:1 directory mirroring in the monorepo, they were relocated to `packages/entries/test/services/` to match their production target paths in `packages/entries/src/services/`.
- **Global Setup for Firebase Admin:** Isolated unit tests in `@journ/entries` depend on Firestore. Mocking Firebase Admin in `packages/entries/test/setup.ts` via Jest's `setupFiles` ensures test suites run hermetically without native network calls or ESM import conflicts.
- **Strict Separation of Part 1 & Part 2:** Prevented premature generation of production files in `packages/entries/src/`. Production code extraction is strictly deferred to Part 2.

---

## 3. Deviations from the Spec

None. All 7 tasks were implemented and verified according to the approved Plan and Tasks.

---

## 4. Verification Evidence

### 4.1 Workspace Registration Check (`npm query .workspace`)
```json
[
  {
    "name": "@journ/account",
    "version": "0.1.0",
    "location": "packages/account"
  },
  {
    "name": "@journ/common",
    "version": "0.1.0",
    "location": "packages/common"
  },
  {
    "name": "@journ/entries",
    "version": "0.1.0",
    "location": "packages/entries"
  }
]
```

### 4.2 JSDoc Metadata Audit
```text
Total test cases: 85 Missing doc: 0
```
100% of test cases in `packages/entries/test/` contain `@testType`, `@target`, and `@description`.

### 4.3 Monolith Regression Test Suite (`npm test`)
```text
Test Suites: 32 passed, 32 total
Tests:       172 passed, 172 total
Snapshots:   0 total
Time:        45.376 s
Ran all test suites.
```
All 32 test suites passed with zero regressions.

### 4.4 Workspace Isolation Check (`git status -s`)
```text
 M package-lock.json
?? Documentation/Specs/Memory/parallel-monorepo-migration-phase3-001.md
?? Documentation/Specs/parallel-monorepo-migration-phase3-001.md
?? packages/entries/jest.config.js
?? packages/entries/package.json
?? packages/entries/test/
?? packages/entries/tsconfig.json
```
Zero files in `src/` or `frontend/` were modified.

---

## 5. Failures & Dead Ends

None.

---

## 6. Known Issues & Follow-ups

- Pre-existing cron timer exit warning in legacy monolith test runner persists without affecting test results:
  `A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown.`
- Staged test suites in `packages/entries/test/` import from `@journ/entries/...` which will be fulfilled in Phase 3 Part 2 (`parallel-monorepo-migration-phase3-002.md`).
