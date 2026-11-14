# Scrap GCP Deployment Scripts and Container Blueprints
- Status: Implemented
- Created: 2026-11-14

## 1. Spec (what and why)

### Goal & Context
The project is initiating an architectural migration away from Google Cloud Platform services (starting with replacing Firestore with PostgreSQL and adopting Better Auth). The existing Google Cloud Run and Cloud Scheduler deployment automation scripts (`scripts/deploy.sh` and `scripts/deploy.ps1`) and container configurations (`Dockerfile`, `apps/frontend/Dockerfile`, and their `.dockerignore` files) contain legacy GCP parameters, port conventions, and build-time Firebase environment bindings (`NEXT_PUBLIC_FIREBASE_*`).

To establish a complete clean slate prior to the database and authentication migrations, all legacy deployment scripts, container definitions, and their corresponding npm commands must be removed. A fresh containerization and deployment setup (such as Docker Compose for PostgreSQL, NestJS, and Next.js) will be authored from scratch following the completion of the migration.

### Scope
- **In Scope:**
  - Deletion of `scripts/deploy.sh`.
  - Deletion of `scripts/deploy.ps1`.
  - Deletion of root `Dockerfile`.
  - Deletion of root `.dockerignore`.
  - Deletion of `apps/frontend/Dockerfile`.
  - Deletion of `apps/frontend/.dockerignore`.
  - Removal of the `deploy` and `deploy:ps` script entries from root `package.json`.
- **Explicitly Out of Scope:**
  - Removal of maintenance utility scripts in `scripts/` (e.g., `scripts/reindex-entries.ts` and `scripts/force-habit-generation.ts`).
  - Modifications to application source code in `apps/` or `packages/`.
  - Changes to database configurations or authentication logic (deferred to subsequent migration specs).
  - Deletion of documentation files (e.g., `Documentation/DEPLOYMENT.md` is preserved as historical architectural reference until rewritten).

### Requirements
- **REQ-1:** The GCP deployment automation scripts `scripts/deploy.sh` and `scripts/deploy.ps1` must be deleted from the repository.
- **REQ-2:** The container definitions and Docker ignore files (`Dockerfile`, `.dockerignore`, `apps/frontend/Dockerfile`, and `apps/frontend/.dockerignore`) must be deleted from the repository.
- **REQ-3:** The npm script declarations for `deploy` and `deploy:ps` must be removed from the root `package.json` without modifying any other build, test, dev, or maintenance scripts.
- **REQ-4:** All existing local development, compilation, and test workflows (`npm run build:all`, `npm test`, `npm run dev`) must remain fully functional and error-free after removal.
- **REQ-5:** Utility scripts (`scripts/reindex-entries.ts`, `scripts/force-habit-generation.ts`) must remain intact.

### Acceptance Criteria
- `scripts/deploy.sh` and `scripts/deploy.ps1` do not exist on the filesystem.
- `Dockerfile` and `.dockerignore` do not exist in the root directory.
- `apps/frontend/Dockerfile` and `apps/frontend/.dockerignore` do not exist in the frontend workspace.
- `package.json` does not contain `deploy` or `deploy:ps` keys in its `scripts` dictionary.
- Executing `npm run test` passes without failure.
- Executing `npm run build` compiles successfully.

### Edge Cases & Failure Modes
- **Accidental invocation during CI/CD or local dev:** Any attempt to run `npm run deploy` will fail fast with an unrecognized command rather than deploying partially outdated infrastructure.
- **Dangling references:** Any historical references to `npm run deploy` or Dockerfiles in documentation are benign until new deployment specs replace them.

### Assumptions & Open Questions
- **Assumption:** No active CI/CD runner depends on the presence of the root or frontend `Dockerfile` prior to the new deployment setup being established.
- **Open Questions:** None.

---

## 2. Plan (how)

### Files to Add or Change
- **Files to Delete:**
  - `scripts/deploy.sh`: Obsolete GCP Cloud Run deployment shell script.
  - `scripts/deploy.ps1`: Obsolete GCP Cloud Run deployment PowerShell script.
  - `Dockerfile`: Obsolete root multi-stage backend container definition.
  - `.dockerignore`: Obsolete root Docker ignore manifest.
  - `apps/frontend/Dockerfile`: Obsolete frontend standalone container definition containing legacy Firebase build args.
  - `apps/frontend/.dockerignore`: Obsolete frontend Docker ignore manifest.
- **Files to Modify:**
  - `package.json`: Remove the `"deploy"` and `"deploy:ps"` script entries from the `"scripts"` block. Keep all other workspace, build, and test targets.

### Data Models, Interfaces, and Contracts
- None. This is a chore targeting deployment and containerization artifacts only.

### Dependencies
- No new dependencies added or removed.

### Risks & Trade-offs
- **Risk:** Accidental deletion of utility scripts in `scripts/`.
  - **Mitigation:** Explicitly target only `deploy.sh` and `deploy.ps1`.
- **Risk:** Syntax errors in `package.json` during script entry deletion.
  - **Mitigation:** Ensure trailing commas and JSON formatting are cleanly adjusted.

### Test Strategy
- **REQ-1 & REQ-2 Verification:** File existence check on all 6 target deletion paths.
- **REQ-3 Verification:** Inspect `package.json` to verify removal of `deploy` and `deploy:ps` and validate JSON syntax.
- **REQ-4 & REQ-5 Verification:** Execute `npm run build` and `npm test` across the monorepo, and confirm the utility scripts remain present.

---

## 3. Tasks
- [x] 1. Delete GCP deployment scripts `scripts/deploy.sh` and `scripts/deploy.ps1` (`REQ-1`).  
      *Done when:* Neither `scripts/deploy.sh` nor `scripts/deploy.ps1` exists on the filesystem.
- [x] 2. Delete container blueprints and dockerignore manifests (`REQ-2`).  
      *Done when:* `Dockerfile`, `.dockerignore`, `apps/frontend/Dockerfile`, and `apps/frontend/.dockerignore` do not exist on the filesystem.
- [x] 3. Remove `deploy` and `deploy:ps` from root `package.json` (`REQ-3`).  
      *Done when:* `package.json` parses as valid JSON and lacks `deploy` and `deploy:ps` keys in `scripts`.
- [x] 4. Verify monorepo build, test suite, and utility scripts integrity (`REQ-4`, `REQ-5`).  
      *Done when:* `npm run build` and `npm test` exit with 0, and `scripts/reindex-entries.ts` and `scripts/force-habit-generation.ts` exist.
