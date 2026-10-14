# Parallel Monorepo Migration — Phase 0

**Date:** 2026-10-12  
**Scope:** Workspace Foundation & Coexistence Setup  
**Target:** `package.json`, `tsconfig.base.json`, `apps/`, and `packages/`

---

## Overview

This specification defines Phase 0 of the parallel monorepo migration plan outlined in `Documentation/Specs/parallel-monorepo-migration-plan.md`. The objective is to initialize npm workspaces (`packages/*` and `apps/*`) and shared configuration foundations without disturbing the existing monolith in `src/` or the frontend in `frontend/`.

Under the Strangler Fig pattern, root developer workflows (`npm run start:dev`, `npm run dev:backend`, `npm run build`, and `npm test`) must continue to target `src/` without disruption during all intermediate migration phases.

---

## 1. Root Workspace Configuration (`package.json`)

**Context:** The current repository operates as a single-package project. To enable feature-by-feature package extraction in subsequent phases, npm must be configured to manage multiple local workspace packages.

### Implementation Tasks
- **Declare Workspaces:**
  - Add the `workspaces` field to the root `package.json`:
    ```json
    "workspaces": [
      "packages/*",
      "apps/*"
    ]
    ```
- **Preserve Legacy Root Scripts:**
  - Retain all existing build, runtime, and test commands targeting `src/`:
    - `"build": "tsc"`
    - `"start": "node dist/main.js"`
    - `"dev:backend": "ts-node src/main.ts"`
    - `"dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\""`
    - `"test": "jest"`
    - `"test:watch": "jest --watch"`
    - `"test:coverage": "jest --coverage"`
- **Add Spec Alignment Scripts:**
  - Add `"start:dev": "ts-node src/main.ts"` as an alias for `"dev:backend"` to match the migration spec naming convention.

---

## 2. Directory Structure Setup (`apps/` & `packages/`)

**Context:** npm workspace resolution traverses declared directories. Empty or missing directories should be tracked reliably in source control without causing warnings.

### Implementation Tasks
- **Create `apps/` Workspace Root:**
  - Create directory `apps/`.
  - Add `apps/.gitkeep` to track the folder in git prior to the creation of `apps/backend` (Phase 6) and relocation of `apps/frontend` (Phase 7).
- **Verify `packages/` Workspace Root:**
  - Ensure the `packages/` directory is present and prepared for feature package extraction (`packages/common/`, `packages/account/`, `packages/entries/`, `packages/habit-memory/`, `packages/chat/`, `packages/cron/`).

---

## 3. Shared TypeScript Foundation (`tsconfig.base.json`)

**Context:** Root `tsconfig.json` compiles `src/` to `dist/`. Each migrated package in `packages/*` and each app in `apps/*` will require its own `tsconfig.json`. To prevent duplication of compiler flags and maintain consistency across packages, a shared base configuration is required.

### Implementation Tasks
- **Preserve Root `tsconfig.json`:**
  - Do not modify the existing `tsconfig.json` root scope (`"include": ["src/**/*"]`, `"rootDir": "./src"`). This ensures `npm run build` continues building `src/` cleanly.
- **Create `tsconfig.base.json`:**
  - Define shared TypeScript compiler options at the repository root:
    ```json
    {
      "compilerOptions": {
        "target": "ES2022",
        "module": "commonjs",
        "lib": ["ES2022"],
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "strictPropertyInitialization": false
      }
    }
    ```
  - Subsequent packages will extend this file via `"extends": "../../tsconfig.base.json"`.

---

## 4. Decoupled Test & Runtime Guardrails

**Context:** In future phases, each package will introduce its own isolated test suite in `packages/<feature>/test/`. The legacy monolith test runner must not prematurely pick up or fail on in-flight workspace tests.

### Implementation Tasks
- **Audit `jest.config.js`:**
  - Confirm `roots: ['<rootDir>/src']` remains restricted strictly to `src/`.
  - Ensure test matching patterns (`**/__tests__/**/*.spec.ts`) do not traverse into `packages/` or `apps/`.
- **Runtime Dependency Health:**
  - Ensure transitive and local dependencies resolve cleanly in the root context without build or execution errors.

---

## 5. Verification & Acceptance Criteria

| Verification Step | Command | Acceptance Criteria |
| :--- | :--- | :--- |
| **Workspaces Topology** | `npm query ":root > *"` | Returns registered workspace entries without configuration errors. |
| **Legacy TypeScript Build** | `npm run build` | Exits 0; compiles `src/` to `dist/` with valid types and source maps. |
| **Legacy Dev Execution** | `npm run start:dev` / `npm run dev:backend` | Boots NestJS monolith application successfully via `ts-node src/main.ts`. |
| **Legacy Test Suite** | `npm test` | Executes Jest across `src/**/__tests__/**/*.spec.ts` with all tests passing. |

---

## References

- **Migration Architecture:** [parallel-monorepo-migration-plan.md](./parallel-monorepo-migration-plan.md) (Strangler Fig migration roadmap).
- **System Architecture:** [ARCHITECTURE.md](../ARCHITECTURE.md) (Layer definitions and dependency boundaries).
- **Application Scope:** [SCOPE.md](../SCOPE.md) (Feature definitions and functional requirements).
