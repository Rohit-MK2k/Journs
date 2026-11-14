# Spec Memory: chore-scrap-gcp-deploy-scripts-001

## 1. Summary of steps taken
- Executed file deletion of GCP deployment scripts `scripts/deploy.sh` and `scripts/deploy.ps1`.
- Executed file deletion of container blueprints and ignore files: root `Dockerfile`, root `.dockerignore`, `apps/frontend/Dockerfile`, and `apps/frontend/.dockerignore`.
- Modified root `package.json` to remove the `"deploy"` and `"deploy:ps"` script targets while preserving all build, development, test, and utility scripts.
- Verified removal of target files using PowerShell `Test-Path`.
- Validated `package.json` syntax and property access via `node -e`.
- Confirmed retention of maintenance utility scripts `scripts/reindex-entries.ts` and `scripts/force-habit-generation.ts`.
- Executed complete monorepo compilation (`npm run build`) and full test suite (`npm test`), verifying clean passing status across all packages and the backend application.

## 2. Decisions & rationale
- **Scope expansion to container blueprints:** During Gate 1, the user requested that container definitions (`Dockerfile`, `apps/frontend/Dockerfile`, `.dockerignore`) also be scrapped to establish a complete clean slate. This avoids carrying over legacy Firebase build-time arguments (`NEXT_PUBLIC_FIREBASE_*`) and Cloud Run port conventions into the future PostgreSQL and Better Auth architecture.
- **Retention of utility scripts:** Maintenance scripts (`scripts/reindex-entries.ts` and `scripts/force-habit-generation.ts`) were kept because they provide developer tooling for entries and habit memory workflows independent of cloud deployment.

## 3. Deviations from the spec
None.

## 4. Verification evidence
- **File removal checks (`scripts/deploy.*`):**
  - Command: `Test-Path "scripts/deploy.sh", "scripts/deploy.ps1"`
  - Output: `False, False`
- **Container blueprints removal checks:**
  - Command: `Test-Path "Dockerfile", ".dockerignore", "apps/frontend/Dockerfile", "apps/frontend/.dockerignore"`
  - Output: `False, False, False, False`
- **`package.json` validation:**
  - Command: `node -e "const pkg = require('./package.json'); console.log('deploy:', pkg.scripts.deploy, 'deploy:ps:', pkg.scripts['deploy:ps']); if (pkg.scripts.deploy || pkg.scripts['deploy:ps']) process.exit(1);"`
  - Output: `deploy: undefined deploy:ps: undefined` (exit code 0)
- **Utility scripts presence check:**
  - Command: `Test-Path "scripts/reindex-entries.ts", "scripts/force-habit-generation.ts"`
  - Output: `True, True`
- **Monorepo build execution:**
  - Command: `npm run build`
  - Output: Compiled `@journ/common`, `@journ/account`, `@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`, and `@journ/backend` successfully with exit code 0.
- **Test suite execution:**
  - Command: `npm test`
  - Output: 40 test suites passed (193 total tests passed, 0 failed, exit code 0).

## 5. Failures & dead ends
None.

## 6. Known issues & follow-ups
- `Documentation/DEPLOYMENT.md` remains in the repository as a historical reference to the original GCP dual Cloud Run architecture. It should be rewritten when the new containerization and deployment architecture (e.g. Docker Compose / PostgreSQL) is implemented.
