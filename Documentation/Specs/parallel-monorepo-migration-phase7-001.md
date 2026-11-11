# Parallel Monorepo Migration Phase 7 — Final Verification and Cutover
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-11-12

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Across Phases 1 through 6, all domain logic, adapters, and HTTP controllers were extracted into 6 decoupled workspace packages under `packages/` (`@journ/common`, `@journ/account`, `@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`), and the unified composition root was established in `apps/backend/`.

Throughout these intermediate phases, the Strangler Fig pattern ensured zero disruption by keeping the legacy monolith in `src/` and the frontend in `frontend/` untouched and fully functional.

Phase 7 is the final cutover phase ("Plug Out / Wire In"). Its goal is to complete the monorepo transition by:
1. Verifying all workspace packages and the backend composition root pass compilation and automated tests.
2. Relocating `frontend/` to `apps/frontend/` under the workspace umbrella.
3. Decommissioning and removing the legacy monolith in `src/` and obsolete root build artifacts.
4. Rewiring root developer scripts (`build`, `dev`, `start`, `test`) to delegate directly to workspace packages.
5. Updating root maintenance scripts (`scripts/reindex-entries.ts`, `scripts/force-habit-generation.ts`) to consume `@journ/*` workspace packages instead of legacy `src/` paths.
6. Updating containerization (`Dockerfile`) and deployment scripts (`scripts/deploy.sh`, `scripts/deploy.ps1`) to build and deploy from the monorepo workspace.
7. Validating clean builds and passing test suites across the entire repository.

### 1.2 Scope
- **In Scope:**
  - Full pre-cutover verification of all 6 workspace packages (`packages/*`) and `apps/backend/`.
  - Relocating `frontend/` to `apps/frontend/` and updating its workspace package metadata (`@journ/frontend`).
  - Deleting legacy monolith source directory `src/` and root `dist/`.
  - Updating maintenance scripts in `scripts/`:
    - Updating `scripts/reindex-entries.ts` imports from `../src/...` to `@journ/common`.
    - Updating `scripts/force-habit-generation.ts` imports from `../src/...` to `@journ/common`, `@journ/entries`, and `@journ/habit-memory`.
  - Updating root configuration files:
    - Root `package.json`: Rewiring `build`, `dev`, `start`, `start:dev`, `test`, `build:all`, `start:all`, `build:frontend`, `start:frontend`, `test:frontend`, `reindex`, and `habit:generate` to target workspaces.
    - Root `tsconfig.json`: Aligning root TypeScript settings for monorepo workspace orchestration.
    - Root `jest.config.js`: Configuring root Jest runner to discover tests across `packages/*/test/` and `apps/*/test/` or orchestrating per-workspace test scripts.
  - Updating containerization and deployment configs:
    - Updating `Dockerfile` to build all workspace packages and run `apps/backend/dist/main.js`.
    - Updating `scripts/deploy.sh` and `scripts/deploy.ps1` to reflect `apps/frontend` directory paths and monorepo build procedures.
  - Final post-cutover verification of all workspace builds and tests.

- **Explicitly Out of Scope:**
  - Modifying internal domain logic, interfaces, or database repositories inside `packages/*`.
  - Modifying application code or UI components inside the frontend application.
  - Adding unrequested external dependencies or framework upgrades.

### 1.3 Requirements
- **`REQ-1` Pre-Cutover Test and Build Validation:**
  - All workspace packages (`@journ/common`, `@journ/account`, `@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`) and `apps/backend` must pass independent TypeScript compilation (`npm run build`) and test execution (`npm test`) prior to modifying legacy source files.
- **`REQ-2` Frontend Relocation to `apps/frontend`:**
  - `frontend/` must be moved to `apps/frontend/`.
  - `apps/frontend/package.json` name must be set to `@journ/frontend`.
  - Root `package.json` workspaces (`"workspaces": ["packages/*", "apps/*"]`) must cleanly recognize `@journ/frontend`.
- **`REQ-3` Monolith Source Decommissioning:**
  - Legacy directory `src/` must be removed completely.
  - Legacy root `dist/` compilation artifacts must be cleaned.
- **`REQ-4` Maintenance Scripts Import Realignment:**
  - `scripts/reindex-entries.ts` must resolve `initializeFirebaseAdmin` from `@journ/common` without referencing `src/`.
  - `scripts/force-habit-generation.ts` must resolve imports from `@journ/common`, `@journ/entries`, and `@journ/habit-memory` without referencing `src/`.
- **`REQ-5` Root Configuration & Script Rewiring:**
  - Root `package.json` scripts must be rewired:
    - `build`: Build all workspace packages and `apps/backend`.
    - `start`: Run production backend from `apps/backend`.
    - `start:dev` and `dev:backend`: Run development backend from `apps/backend`.
    - `dev:frontend`: Run Next.js development server from `apps/frontend`.
    - `dev`: Concurrently run `dev:backend` and `dev:frontend`.
    - `test`: Run all workspace package tests.
    - `reindex`: Execute `scripts/reindex-entries.ts` using workspace modules.
    - `habit:generate`: Execute `scripts/force-habit-generation.ts` using workspace modules.
  - Root `tsconfig.json` and `jest.config.js` must be updated to remove references to `src/` and support monorepo orchestration.
- **`REQ-6` Containerization & Deployment Script Updates:**
  - `Dockerfile` must copy root manifests, `packages/`, and `apps/backend`, run workspace installation and compilation, and start `apps/backend/dist/main.js`.
  - `scripts/deploy.sh` and `scripts/deploy.ps1` must reference `apps/frontend` instead of `frontend/` for deployment source and env file loading.
- **`REQ-7` Post-Cutover Comprehensive Verification:**
  - Running root `npm run build` must cleanly build all workspace packages and applications with 0 TypeScript compiler errors.
  - Running root `npm test` (or workspace test runner) must pass all unit and integration tests across all packages and apps with 100% success rate.
  - Zero broken file references or residual imports targeting `src/` anywhere in the repository.

### 1.4 Acceptance Criteria
- **`AC-1` (Pre-Cutover):** `npm run build -ws` and `npm test -ws` exit code 0 before legacy code deletion.
- **`AC-2` (Frontend):** `apps/frontend` exists, `npm run build -w @journ/frontend` compiles successfully, and `frontend/` in root is removed.
- **`AC-3` (Monolith Retirement):** `src/` does not exist on disk; `git status` records file deletions cleanly.
- **`AC-4` (Maintenance Scripts):** `npx ts-node --transpile-only scripts/reindex-entries.ts` and `scripts/force-habit-generation.ts` compile without missing module errors.
- **`AC-5` (Root Scripts):** `npm run build`, `npm run start:dev`, `npm run dev`, and `npm test` execute their respective workspace targets as configured in root `package.json`.
- **`AC-6` (Deployment Configs):** `Dockerfile` builds a production container image successfully with `docker build` (or dry-run lint), and deployment scripts refer strictly to `apps/frontend`.
- **`AC-7` (Zero Broken Links):** Grepping the entire repository for `from '../src/` or `from 'src/` returns zero matches outside git history or archived migration documents.

### 1.5 Edge Cases & Failure Modes
- **Package Hoisting & Symlinks:** npm workspace symlinks in `node_modules/@journ/*` must point correctly to local packages; stale symlinks must be refreshed via `npm install`.
- **Frontend Environment Variables:** Relocating `frontend/` must preserve any local `.env` or `.env.local` files without exposing them to source control.
- **Docker Layer Caching & Build Order:** In `Dockerfile`, packages must be copied and built before `apps/backend` to ensure TypeScript compilation resolves package dist declarations.
- **Module Resolution in ts-node:** Running scripts under `scripts/` with `ts-node` requires proper tsconfig paths or module resolution targeting the built packages or workspace source.

### 1.6 Assumptions & Open Questions
- **Assumptions:**
  - Development and production run on Node.js 20+ with native npm workspaces support.
  - The legacy monolith code in `src/` is fully superseded by `packages/*` and `apps/backend/`.
- **Open Questions:**
  - None. Scope and target structure strictly follow `Documentation/Specs/parallel-monorepo-migration-plan.md`.

---

## 2. Plan (How)

### 2.1 Files and Components to Add or Change

| File / Component | Change Type | Reason |
|---|---|---|
| `frontend/` -> `apps/frontend/` | Move | Move Next.js application into the target monorepo workspace location (`apps/*`). |
| `apps/frontend/package.json` | Modify | Update name to `@journ/frontend` to align with monorepo workspace naming conventions. |
| `src/` | Delete | Complete decommissioning of the legacy monolithic backend source. |
| `dist/` | Delete | Remove legacy root build artifacts generated from `src/`. |
| `package.json` (root) | Modify | Rewire root scripts to orchestrate workspace targets across `packages/*` and `apps/*`. |
| `tsconfig.json` (root) | Modify | Remove legacy `src/` rootDir/include; reference workspace packages and root utility scripts. |
| `jest.config.js` (root) | Modify | Reconfigure root test runner to orchestrate workspace tests or run multi-project runners. |
| `scripts/reindex-entries.ts` | Modify | Update import from `../src/...` to `@journ/common`. |
| `scripts/force-habit-generation.ts` | Modify | Update imports from `../src/...` to `@journ/common`, `@journ/entries`, and `@journ/habit-memory`. |
| `Dockerfile` | Modify | Update multi-stage Docker build to copy and build `packages/*` and `apps/backend/`, executing `node apps/backend/dist/main.js`. |
| `scripts/deploy.sh` & `scripts/deploy.ps1` | Modify | Update source and env file paths from `frontend/` to `apps/frontend/`. |

### 2.2 Data Models, Interfaces, and Contracts
- No new domain data models or interfaces are created in Phase 7.
- Existing contracts defined in `@journ/common` (`ISearchEntryProvider`, `IAIProvider`, etc.) continue to govern cross-package communication.
- NPM workspace dependency graph:
  - `@journ/common` (base package)
  - `@journ/account` -> depends on `@journ/common`
  - `@journ/entries` -> depends on `@journ/common`
  - `@journ/habit-memory` -> depends on `@journ/common`, `@journ/entries`
  - `@journ/chat` -> depends on `@journ/common`
  - `@journ/cron` -> depends on `@journ/common`
  - `@journ/backend` -> composition root, depends on all six `@journ/*` packages
  - `@journ/frontend` -> standalone Next.js web application under `apps/frontend`

### 2.3 Dependencies
- No new runtime or development dependencies are introduced.
- Existing toolchain (`concurrently`, `typescript`, `jest`, `ts-node`, `ts-jest`) is preserved at the root level for workspace orchestration.

### 2.4 Risks and Trade-offs
- **Risk: Build Order in Monorepo:** `apps/backend` depends on the `.d.ts` output of the `packages/*`. If built out of order, TypeScript compilation in `apps/backend` could fail.
  - *Mitigation:* Explicitly chain package builds before `apps/backend` in root `build` script (`npm run build:packages && npm run build:backend`).
- **Risk: Stale Root node_modules Symlinks:** Moving `frontend` to `apps/frontend` might leave orphan workspace links in `node_modules`.
  - *Mitigation:* Run `npm install` after relocating `frontend/` to rebuild the workspace dependency symlinks.
- **Risk: Docker Image Size & Build Efficiency:** Copying the entire workspace into Docker might inflate image build time.
  - *Mitigation:* Use multi-stage Docker build with `.dockerignore` ignoring root `node_modules`, `dist`, and `apps/frontend`.

### 2.5 Test Strategy
- **Requirement Coverage:**
  - `REQ-1`: Covered by executing per-package test scripts across all 6 `packages/*` and `apps/backend`.
  - `REQ-2`: Covered by verifying `@journ/frontend` build and test scripts via `npm run build -w @journ/frontend` and `npm test -w @journ/frontend`.
  - `REQ-3`: Covered by verifying `src/` and legacy `dist/` do not exist via file system inspection.
  - `REQ-4`: Covered by TypeScript dry-run compilation of `scripts/reindex-entries.ts` and `scripts/force-habit-generation.ts`.
  - `REQ-5`: Covered by executing root `npm run build`, `npm run start:dev` (smoke test), and `npm test`.
  - `REQ-6`: Covered by Docker build syntax check / dry run and deployment script path assertions.
  - `REQ-7`: Covered by end-to-end workspace test execution (`npm test`) and codebase grep ensuring zero dangling `src/` import paths.

---

## 3. Tasks

- [x] **Task 1: Pre-Cutover Workspace Verification (`REQ-1`)**
  - Execute TypeScript compilation for all 6 packages and `apps/backend`.
  - Execute test runner for all 6 packages and `apps/backend`.
  - *Done when:* All 6 packages and `apps/backend` compile cleanly with 0 errors and all unit/integration tests pass 100%.

- [x] **Task 2: Frontend Relocation to `apps/frontend` (`REQ-2`)**
  - Move directory `frontend/` to `apps/frontend/`.
  - Update `apps/frontend/package.json` name to `@journ/frontend`.
  - Run `npm install` to update root workspace symlinks.
  - *Done when:* `apps/frontend` exists, `npm test -w @journ/frontend` passes, and `npm run build -w @journ/frontend` compiles successfully.

- [x] **Task 3: Decommission Legacy Monolith `src/` (`REQ-3`)**
  - Remove directory `src/` and remove root `dist/`.
  - *Done when:* `src/` and root `dist/` are removed from the filesystem and tracked by git.

- [x] **Task 4: Maintenance Scripts Import Realignment (`REQ-4`)**
  - Update imports in `scripts/reindex-entries.ts` to reference `@journ/common`.
  - Update imports in `scripts/force-habit-generation.ts` to reference `@journ/common`, `@journ/entries`, and `@journ/habit-memory`.
  - *Done when:* Both scripts compile without errors under `npx ts-node --transpile-only`.

- [x] **Task 5: Root Configuration & Script Rewiring (`REQ-5`)**
  - Update root `package.json` scripts:
    - `"build:packages": "npm run build -w @journ/common -w @journ/account -w @journ/entries -w @journ/habit-memory -w @journ/chat -w @journ/cron"`
    - `"build:backend": "npm run build -w @journ/backend"`
    - `"build:frontend": "npm run build -w @journ/frontend"`
    - `"build": "npm run build:packages && npm run build:backend"`
    - `"build:all": "npm run build && npm run build:frontend"`
    - `"start": "node apps/backend/dist/main.js"`
    - `"start:dev": "npm run start:dev -w @journ/backend"`
    - `"dev:backend": "npm run start:dev -w @journ/backend"`
    - `"dev:frontend": "npm run dev -w @journ/frontend"`
    - `"dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\""`
    - `"test:packages": "npm test -w @journ/common -w @journ/account -w @journ/entries -w @journ/habit-memory -w @journ/chat -w @journ/cron"`
    - `"test:backend": "npm test -w @journ/backend"`
    - `"test:frontend": "npm test -w @journ/frontend"`
    - `"test": "npm run test:packages && npm run test:backend"`
    - `"test:all": "npm run test && npm run test:frontend"`
  - Update root `tsconfig.json` to remove legacy `src/` settings and configure workspace path mappings or root script inclusion.
  - Update root `jest.config.js` to eliminate `roots: ['<rootDir>/src']`.
  - *Done when:* Root `npm run build` and `npm test` execute cleanly across workspace packages.

- [x] **Task 6: Containerization & Deployment Configuration (`REQ-6`)**
  - Update `Dockerfile` to copy `packages/` and `apps/backend/`, compile packages, and start `apps/backend/dist/main.js`.
  - Update `scripts/deploy.sh` and `scripts/deploy.ps1` to reference `apps/frontend` and target the new monorepo paths.
  - *Done when:* `Dockerfile` references valid paths, and deployment scripts reference `apps/frontend`.

- [x] **Task 7: Post-Cutover Comprehensive Verification (`REQ-7`)**
  - Run full automated test suite across all workspace packages and applications (`npm test`).
  - Run codebase grep to verify zero occurrences of `from '../src/` or `from 'src/`.
  - Verify clean git status and documentation integrity.
  - *Done when:* All workspace tests pass 100%, zero legacy `src/` import references exist, and clean builds succeed.
