# Change Log 4 - Spec Memory

**Date:** 2026-09-06  
**Log ID:** `change-log-4`  
**Scope:** Google Cloud Platform (GCP) dual Cloud Run deployment architecture, NestJS API containerization and runtime adaptation (PORT injection, host binding, CORS, health probe), Next.js 16 standalone containerization with dynamic proxy rewrites, secure Cloud Scheduler HTTP webhook triggers for nightly 02:00 AM maintenance routines, and cross-platform deployment automation scripts.

---

## 1. Summary of Commits

| Commit Hash | Type / Scope | Description |
|-------------|--------------|-------------|
| `d6cb178` | `feat(backend)` | Adapt API runtime for Cloud Run: PORT fallback, 0.0.0.0 host binding, CORS, @Public() decorator, and HealthController |
| `331748a` | `feat(cron)` | Add Cloud Scheduler webhook endpoints: CronController and CronModule with x-cron-secret authentication |
| `fd0b0b8` | `feat(frontend)` | Add standalone build and Dockerfile: Next.js standalone output, dynamic BACKEND_API_URL rewrites, and multi-stage containerization |
| `61cb15c` | `feat(deploy)` | Add Dockerfile and gcloud scripts: multi-stage backend Dockerfile and automated bash/PowerShell deployment scripts |

---

## 2. Core Architectural & Code Changes

### 2.1 Backend Cloud Run Adaptation (`src/main.ts`, `src/common/`)
- **Port & Host Binding:** Updated `src/main.ts` to bind on `0.0.0.0` and prioritize `process.env.PORT` (assigned by Cloud Run, default 8080) over `BACKEND_PORT` or fallback port `8000`.
- **Cross-Origin Resource Sharing (CORS):** Enabled CORS with credentials in `src/main.ts` to permit direct client access and server-side proxied calls.
- **Unauthenticated Route Support:** Implemented `@Public()` decorator (`src/common/decorators/public.decorator.ts`) using NestJS `SetMetadata`. Enhanced `FirebaseAuthGuard` with optional `Reflector` injection to bypass authentication when endpoints are explicitly marked public, preserving full backwards compatibility with existing test suites.
- **Health Check & Startup Probes:** Added `HealthController` (`src/common/presentation/controllers/health.controller.ts`) exposing `/health` and `/` endpoints for Cloud Run startup, liveness, and uptime checks.

### 2.2 Cloud Scheduler HTTP Webhooks (`src/cron/`, `src/habit-memory/`, `src/entries/`)
- **Zero-Idle-Cost Scheduled Tasks:** Exposed `POST /cron/habit-memory`, `POST /cron/attachment-cleanup`, and `POST /cron/all` via `CronController` (`src/cron/cron.controller.ts`).
- **Webhook Authentication:** Enforced `x-cron-secret` header verification against `process.env.CRON_SECRET` to prevent unauthorized invocation while permitting unauthenticated local developer runs when unset.
- **Decoupled Architecture:** Created `CronModule` importing `HabitMemoryModule` and `EntriesModule` without circular dependencies, cleanly adhering to the Single Responsibility Principle.

### 2.3 Next.js Standalone Containerization (`frontend/`)
- **Standalone Build Mode:** Configured `output: "standalone"` in `frontend/next.config.ts` to produce a trimmed production artifact in `.next/standalone`, eliminating unnecessary `node_modules` and slashing container size.
- **Dynamic API Proxying:** Configured rewrites in `frontend/next.config.ts` using `process.env.BACKEND_API_URL` to route `/api/:path*` to the deployed backend Cloud Run URL, preventing cross-origin CORS overhead in browser sessions.
- **Multi-Stage Container:** Authored `frontend/Dockerfile` featuring `deps`, `builder`, and `runner` stages with unprivileged `nextjs` execution. Inlined Firebase Web Client SDK keys via `ARG`/`ENV` build arguments.
- **Haste Map Collision Prevention:** Added `modulePathIgnorePatterns: ['<rootDir>/.next/']` to `frontend/jest.config.ts` to avoid Jest haste map module collisions between root and standalone bundles.

### 2.4 Deployment Automation & Documentation (`scripts/`, `Dockerfile`, `Documentation/`)
- **Backend Dockerfile:** Created multi-stage `Dockerfile` and `.dockerignore` for NestJS compiling TypeScript via `npm run build` and running `node dist/main.js` under an unprivileged `nestjs` user on port 8080.
- **Automated Deployment Scripts:** Created `scripts/deploy.sh` (POSIX bash) and `scripts/deploy.ps1` (PowerShell). Both scripts:
  1. Validate `gcloud` authentication and project context.
  2. Enable required GCP APIs (`run`, `cloudbuild`, `artifactregistry`, `firestore`, `aiplatform`, `cloudscheduler`).
  3. Deploy `journ-backend` to Cloud Run and extract the assigned service URL.
  4. Deploy `journ-frontend` passing the backend URL and client Firebase variables.
  5. Provision/update Google Cloud Scheduler job `journ-maintenance-cron` (`0 2 * * *`).
- **NPM Integration:** Added `npm run deploy` and `npm run deploy:ps` convenience shortcuts to `package.json`.
- **Technical Documentation:** Authored `Documentation/DEPLOYMENT.md` providing architectural diagrams, prerequisite setup instructions, IAM role requirements, manual CLI commands, and health verification workflows.

---

## 3. Verification & Test Coverage

- **Backend:** 32/32 test suites passed (172 total unit and integration tests across all NestJS modules).
- **Frontend:** 7/7 test suites passed (38 total unit tests).
- **TypeScript Compilation:** Clean compilation across backend (`npm run build`) and frontend (`npm run build:frontend`).
- **Git Commit Discipline:** Changes organized into 4 contextual Conventional Commits following project standards.
