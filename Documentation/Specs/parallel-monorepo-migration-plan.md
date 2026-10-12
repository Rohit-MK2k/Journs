# Parallel Feature-by-Feature Monorepo Migration Plan

**Date:** 2026-10-12  
**Scope:** Incremental, non-breaking migration of the monolith (`src/`) into a DDD-compliant Monorepo workspace (`packages/*` and `apps/*`) using the Strangler Fig pattern.  
**Target:** `packages/*`, `apps/*`, root `package.json`, and eventual retirement of `src/`.

---

## 1. Core Principles & Constraints

1. **Zero Downtime / Non-Interference:** 
   - The legacy backend code in `src/` and the frontend in `frontend/` must remain completely untouched and fully functional throughout all intermediate migration phases.
   - Root development scripts (`npm run start:dev`, `npm run build`, `npm run test`) continue pointing strictly to `src/` until the final cutover.
2. **Feature-by-Feature Strangler Fig Migration:**
   - Migrate one bounded context at a time into `packages/<feature>/`.
   - Code is not deleted from `src/` until all packages are extracted, tested, and ready for cutover.
3. **Decoupled Test Placement:**
   - Tests for each newly migrated package will reside in `packages/<feature>/test/` (outside `src/`), mirroring the internal folder structure of `src/`.
   - Each package defines its own independent `npm test` script.
4. **Strict DDD Layer Discipline & Dependency Inversion:**
   - Packages follow the internal 3-layer architecture: `core/`, `api/`, and `adapters/`.
   - Circular inter-package dependencies are prevented by placing shared domain contracts and interfaces in `@journ/common`. Packages depend on abstractions rather than concrete peer implementations.
5. **Final Atomic Cutover:**
   - An isolated composition root (`apps/backend`) will be introduced to wire and verify the packages.
   - Only when all feature packages pass verification will `src/` be removed, `frontend/` moved to `apps/frontend`, and root scripts rewired.

---

## 2. Target Workspace Structure

```text
/
├── package.json                         # Root workspace managing packages/* and apps/*
├── frontend/                            # Legacy frontend (relocated to apps/frontend at cutover)
├── src/                                 # Legacy backend monolith (deleted at cutover)
├── apps/
│   ├── backend/                         # New NestJS Composition Root (wires @journ/*)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── main.ts
│   │       └── app.module.ts
│   └── frontend/                        # Relocated Next.js app (post-cutover)
└── packages/
    ├── common/                          # @journ/common (Foundation: guards, filters, shared contracts)
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── src/
    │   └── test/
    ├── account/                         # @journ/account
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── src/
    │   └── test/
    ├── entries/                         # @journ/entries
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── src/
    │   └── test/
    ├── habit-memory/                    # @journ/habit-memory
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── src/
    │   └── test/
    ├── chat/                            # @journ/chat
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── src/
    │   └── test/
    └── cron/                            # @journ/cron
        ├── package.json
        ├── tsconfig.json
        ├── src/
        └── test/
```

---

## 3. High-Level Migration Phases

### Phase 0: Workspace Foundation & Coexistence Setup
- Update root `package.json` to declare `workspaces: ["packages/*", "apps/*"]`.
- Retain all legacy root scripts (`start:dev`, `build`, `test`, `lint`) pointing to `src/`.
- Ensure `npm run start:dev` and `npm run test` continue passing seamlessly.

### Phase 1: Foundation Extraction — `@journ/common`
- Extract shared infrastructure, error definitions, guards, and cloud provider adapters from `src/common/` to `packages/common/`.
- Establish cross-domain contract interfaces (e.g. entry search contracts, AI provider interfaces) to prevent downstream circular dependencies.
- Mirror tests under `packages/common/test/` matching the `src/` layout.
- Validate `@journ/common` builds and tests pass independently.

### Phase 2: Independent Feature Extraction — `@journ/account`
- Extract domain entities, auth provider adapters, and account controllers from `src/account/` to `packages/account/`.
- Depend on `@journ/common` for base guards and interfaces.
- Mirror tests in `packages/account/test/`.
- Validate `@journ/account` builds and tests pass independently.

### Phase 3: Core Domain Extraction — `@journ/entries`
- Extract entry domain models, Firestore repositories, vector search adapters, and controllers from `src/entries/` to `packages/entries/`.
- Implement external search provider contracts defined in `@journ/common`.
- Mirror tests in `packages/entries/test/`.
- Validate `@journ/entries` builds and tests pass independently.

### Phase 4: Dependent Feature Extraction — `@journ/habit-memory`
- Extract habit memory domain logic, Firestore stores, cron jobs, and controllers from `src/habit-memory/` to `packages/habit-memory/`.
- Consume entry contracts via `@journ/common` rather than direct circular links.
- Mirror tests in `packages/habit-memory/test/`.
- Validate `@journ/habit-memory` builds and tests pass independently.

### Phase 5: Complex Feature Extraction — `@journ/chat` & `@journ/cron`
- Extract chat session domain, Gemini streaming adapters, and controllers from `src/chat/` to `packages/chat/`.
- Extract Cloud Scheduler webhooks from `src/cron/` to `packages/cron/`.
- Mirror tests in `packages/chat/test/` and `packages/cron/test/`.
- Validate both packages compile and pass tests in isolation.

### Phase 6: Incremental Composition Root Setup — `apps/backend`
- Create `apps/backend` with its own `package.json` and NestJS bootstrap (`main.ts`, `app.module.ts`).
- Declare dependencies on all `@journ/*` workspace packages in `apps/backend/package.json`.
- Configure `apps/backend` to run on an alternate port during staging/verification to allow side-by-side execution with the legacy monolith.

### Phase 7: Verification & Final Cutover ("Plug Out / Wire In")
- Run full automated test suite across all `packages/*` and `apps/backend`.
- Verify runtime behavior and API equivalence.
- Relocate `frontend/` to `apps/frontend/` and update any repository scripts.
- Remove the legacy `src/` monolith folder.
- Update root `package.json` scripts (`start`, `build`, `test`) to delegate to `apps/backend` and `apps/frontend`.
- Update Dockerfiles and deployment configurations (Cloud Run, Cloud Build) to reflect the new monorepo layout.
