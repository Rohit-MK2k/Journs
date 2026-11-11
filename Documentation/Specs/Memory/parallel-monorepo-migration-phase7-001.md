# Parallel Monorepo Migration Phase 7 — Spec Memory

- **Spec Document:** `Documentation/Specs/parallel-monorepo-migration-phase7-001.md`
- **Target:** Root workspace, `apps/frontend/`, `Dockerfile`, `scripts/`, and retirement of `src/`
- **Date:** 2026-11-12
- **Status:** Implemented

---

## 1. Summary of Steps Taken

1. **Pre-Cutover Workspace Validation (`REQ-1`):**
   - Executed clean build across all 6 workspace packages (`@journ/common`, `@journ/account`, `@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`) and `apps/backend`.
   - Executed full test suites across all 6 workspace packages and `apps/backend` (40 test suites, 193 tests passed 100%).

2. **Frontend Relocation to `apps/frontend` (`REQ-2`):**
   - Relocated directory `frontend/` to `apps/frontend/` using `git mv` to preserve full commit history.
   - Updated package manifest `apps/frontend/package.json` name to `@journ/frontend`.
   - Updated `apps/frontend/tsconfig.json` to exclude `jest.config.ts` from Next.js production typecheck.
   - Ran `npm install` to regenerate workspace symlinks. Verified independent tests (7 suites, 38 tests passed) and production build (`next build` compiled all routes).

3. **Legacy Monolith Source Decommissioning (`REQ-3`):**
   - Removed legacy `src/` directory containing the monolith backend source via `git rm -r src`.
   - Removed obsolete legacy build artifacts in root `dist/`.

4. **Maintenance Scripts Import Realignment (`REQ-4`):**
   - Updated `scripts/reindex-entries.ts` to import `initializeFirebaseAdmin` directly from `@journ/common`.
   - Updated `scripts/force-habit-generation.ts` to import from `@journ/common`, `@journ/entries`, and `@journ/habit-memory`.
   - Verified execution and type checking (`scripts/reindex-entries.ts` successfully re-indexed 8 entries against Firestore).

5. **Root Configuration & Script Rewiring (`REQ-5`):**
   - Rewired scripts in root `package.json` to orchestrate workspace packages and applications:
     - `build:packages`, `build:backend`, `build:frontend`, `build`, `build:all`
     - `start`, `start:dev`, `start:backend`, `start:frontend`, `start:all`
     - `dev:backend`, `dev:frontend`, `dev`
     - `test:packages`, `test:backend`, `test:frontend`, `test`, `test:all`
     - `reindex`, `habit:generate`, `deploy`, `deploy:ps`
   - Updated root `tsconfig.json` to extend `./tsconfig.base.json` targeting `scripts/**/*` with `noEmit: true`.
   - Updated root `jest.config.js` to configure multi-project runner across `packages/*` and `apps/backend`.

6. **Containerization & Deployment Configuration (`REQ-6`):**
   - Refactored `Dockerfile` into a multi-stage monorepo build copying `packages/` and `apps/backend`, compiling via `npm run build`, and executing `apps/backend/dist/main.js`.
   - Updated `.dockerignore` to ignore `apps/frontend` instead of `frontend`.
   - Updated `scripts/deploy.sh` and `scripts/deploy.ps1` to reference `apps/frontend` for deployment source and `.env.local` loading.

7. **Post-Cutover Comprehensive Verification (`REQ-7`):**
   - Executed `npm run build:all` compiling all 6 packages, `apps/backend`, and `apps/frontend` with 0 errors.
   - Executed `npm run test:all` passing all 47 test suites (231 tests) with 100% success rate.
   - Verified via repository grep that zero lingering imports reference legacy `src/`.

---

## 2. Decisions & Rationale

- **Preserving Git History on Directory Moves:** Used `git mv frontend apps/frontend` so all past commit logs, blame annotations, and histories remain intact.
- **Root Script Granularity:** Provided fine-grained workspace scripts (`build:packages`, `build:backend`, `build:frontend`) alongside aggregated targets (`build`, `build:all`, `test`, `test:all`) to maintain fast local developer workflows while enabling comprehensive continuous integration.
- **Next.js Production Build Exclusion for `jest.config.ts`:** In `apps/frontend/tsconfig.json`, added `jest.config.ts` to `exclude`. This prevents mismatched Jest type definitions (due to workspace package hoisting) from failing the Next.js production type checker while leaving Jest execution unaffected.

---

## 3. Deviations from the Spec

None. The implementation followed the specification and plan exactly.

---

## 4. Verification Evidence

- `npm run build:all`:
  - Output: Compiled `@journ/common`, `@journ/account`, `@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`, `@journ/backend`, and `@journ/frontend` (Next.js 16.3.4 static pages) with exit code 0.
- `npm run test:all`:
  - `@journ/common`: 8/8 suites, 32/32 tests passed.
  - `@journ/account`: 5/5 suites, 7/7 tests passed.
  - `@journ/entries`: 12/12 suites, 85/85 tests passed.
  - `@journ/habit-memory`: 5/5 suites, 20/20 tests passed.
  - `@journ/chat`: 5/5 suites, 31/31 tests passed.
  - `@journ/cron`: 2/2 suites, 6/6 tests passed.
  - `@journ/backend`: 3/3 suites, 12/12 tests passed.
  - `@journ/frontend`: 7/7 suites, 38/38 tests passed.
  - Total: 47 suites, 231 tests passed in 58.7s.
- `scripts/reindex-entries.ts` execution check:
  - Output: Successfully re-indexed 8 entries with 768-dim embeddings in Firestore.
- Codebase grep for `src/`:
  - Output: 0 occurrences of imports from `../src/` or legacy monolith references outside internal package directories.

---

## 5. Failures & Dead Ends

- **Next.js Typecheck Failure on `jest.config.ts`:**
  - *Symptom:* `next build` failed with `TS2345: Argument of type ... is not assignable to parameter of type 'InitialProjectOptions'`.
  - *Cause:* npm workspace hoisting unified `@types/jest` across packages where Next.js `next/jest.js` type definitions expected a specific version.
  - *Fix:* Added `"jest.config.ts"` to `exclude` in `apps/frontend/tsconfig.json`.

---

## 6. Known Issues & Follow-ups

None. The Strangler Fig migration is now complete. The monorepo layout fully conforms to `Documentation/Specs/parallel-monorepo-migration-plan.md`.
