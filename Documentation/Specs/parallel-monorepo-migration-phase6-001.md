# Parallel Monorepo Migration Phase 6 (Part 1) — `apps/backend` Test Suite Specification
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-11-04

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Across Phases 1 through 5, all six feature and infrastructure domains were extracted into decoupled workspace libraries under `packages/`:
- `@journ/common` (`packages/common/`)
- `@journ/account` (`packages/account/`)
- `@journ/entries` (`packages/entries/`)
- `@journ/habit-memory` (`packages/habit-memory/`)
- `@journ/chat` (`packages/chat/`)
- `@journ/cron` (`packages/cron/`)

Each package has independent TypeScript compilation, isolated Jest test runners, and decoupled domain logic. However, none of these packages functions as an executable HTTP server on its own.

Phase 6 introduces the **Composition Root** under `apps/backend/`. In accordance with the Spec-Driven Development (SDD) paradigm and the Strangler Fig pattern established in previous phases, Phase 6 is divided into two distinct specifications:
- **Part 1 (this specification):** Establishes the `apps/backend` workspace package, isolates its build and Jest test runner environments, and stages decoupled integration and unit test suites in `apps/backend/test/` with strict 1:1 directory mirroring of the planned `apps/backend/src/` layout and mandatory JSDoc test classification metadata.
- **Part 2 (subsequent specification):** Implements the production composition root module (`app.module.ts`), bootstrap factory (`bootstrap.ts`), and entry point (`main.ts`) in `apps/backend/src/`, executes and verifies all staged test suites with 100% pass rate, and verifies zero regressions in the legacy monolith.

The goal of this Part 1 specification is to define the test runners and explicit behavioral assertions for the assembled composition root before writing any production application code.

### 1.2 Scope
- **In Scope:**
  - Workspace package manifest:
    - `apps/backend/package.json` declaring `@journ/backend` with workspace dependencies on all six packages (`@journ/common`, `@journ/account`, `@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`), NestJS dependencies, and `build`, `start`, `start:dev`, and `test` scripts.
  - TypeScript configuration:
    - `apps/backend/tsconfig.json` extending root `tsconfig.base.json` targeting `<rootDir>/src` and `<rootDir>/test`.
  - Isolated Jest runner configuration:
    - `apps/backend/jest.config.js` scoped strictly to `<rootDir>/test` with module aliases resolving workspace packages and setup configuration.
  - Global test mock setup in `apps/backend/test/setup.ts` to mock external cloud provider singletons (Firebase Admin auth and firestore singletons, Google Vertex/GenAI clients).
  - Strict 1:1 directory layout mirroring between `apps/backend/test/` and the planned `apps/backend/src/` structure:
    - `apps/backend/test/app.module.spec.ts` mirroring `apps/backend/src/app.module.ts`
    - `apps/backend/test/bootstrap.spec.ts` mirroring `apps/backend/src/bootstrap.ts`
    - `apps/backend/test/main.spec.ts` mirroring `apps/backend/src/main.ts`
  - Staging decoupled integration and unit test suites:
    - **NestJS DI Container & Route Integration Test Suite (`test/app.module.spec.ts`):** Verifies DI container compilation, controller resolution across all six domain packages, global filter binding, and guard enforcement (`GET /health` 200 OK, unauthenticated protected routes 401 Unauthorized, `@Public()` route bypass).
    - **Application Bootstrap Factory Unit Test Suite (`test/bootstrap.spec.ts`):** Verifies creation of the Express application instance, `ValidationPipe` whitelist/transform options, CORS configuration, and port selection fallback logic.
    - **Main Entrypoint Unit Test Suite (`test/main.spec.ts`):** Verifies that `initializeFirebaseAdmin()` from `@journ/common` is invoked before application bootstrap, and environment file loading is safely handled.
  - Standardized JSDoc test metadata annotations (`@testType`, `@target`, `@description`) across 100% of staged test cases.

- **Explicitly Out of Scope:**
  - Writing production code in `apps/backend/src/` (deferred strictly to Part 2).
  - Modifying, moving, or deleting any files in the legacy monolith `src/` or `frontend/`.
  - Modifying any existing packages in `packages/*`.
  - Final cutover actions such as deleting `src/` or moving `frontend/` to `apps/frontend/` (deferred strictly to Phase 7).

### 1.3 Requirements
- **`REQ-1` Package Scaffolding & Test Runner Isolation:**
  - `apps/backend/package.json` must be configured as a private workspace package under npm workspaces.
  - `apps/backend/jest.config.js` must restrict test discovery strictly to `roots: ['<rootDir>/test']` with `testMatch: ['**/*.spec.ts']`.
  - Root `jest.config.js` (`roots: ['<rootDir>/src']`) must remain completely isolated from `apps/backend/test/`.

- **`REQ-2` Strict 1:1 Directory Layout Mirroring:**
  - The test file hierarchy in `apps/backend/test/` must replicate the target `apps/backend/src/` hierarchy path-for-path.
  - Every source file planned for `src/` must have an exact 1:1 counterpart in `test/`:
    - `apps/backend/src/app.module.ts` <-> `apps/backend/test/app.module.spec.ts`
    - `apps/backend/src/bootstrap.ts` <-> `apps/backend/test/bootstrap.spec.ts`
    - `apps/backend/src/main.ts` <-> `apps/backend/test/main.spec.ts`
  - No catch-all `__tests__/` directory may be used.

- **`REQ-3` AppModule Dependency Injection Container Integration Test Suite (`test/app.module.spec.ts`):**
  - Must define container integration tests verifying that `AppModule` compiles using NestJS `Test.createTestingModule`:
    - Resolves all six domain modules: `CommonModule`, `AccountModule`, `EntriesModule`, `HabitMemoryModule`, `ChatModule`, `CronModule`.
    - Resolves controllers from every domain module: `HealthController`, `AccountController`, `EntriesController`, `HabitMemoryController`, `ChatController`, `CronController`.
    - Binds `APP_FILTER` to `DomainExceptionFilter` from `@journ/common`.
    - Binds `APP_GUARD` to `FirebaseAuthGuard` from `@journ/common`.
    - Resolves with zero circular dependency errors or unhandled DI tokens.

- **`REQ-4` Route Mounting & Security Guard Verification (`test/app.module.spec.ts`):**
  - Must define end-to-end integration tests using `supertest` against the compiled `AppModule` instance:
    - `GET /health`: Returns `200 OK` with `{ status: 'ok' }` without requiring authentication.
    - `GET /entries`: Returns `401 Unauthorized` when called without an `Authorization` header.
    - `GET /account/profile`: Returns `401 Unauthorized` when called without an `Authorization` header.
    - `POST /cron/habit-memory`: Bypasses `FirebaseAuthGuard` because it is marked `@Public()`, proceeding to cron secret evaluation.
    - Domain Exception Handling: When a controller or service throws a domain error (e.g. `EntityNotFoundError`), `DomainExceptionFilter` translates it to a structured JSON error response with the appropriate HTTP status code.

- **`REQ-5` Application Bootstrap Factory Unit Test Suite (`test/bootstrap.spec.ts`):**
  - Must define unit tests for the application bootstrap factory in `src/bootstrap.ts`:
    - Application Creation: Verifies that `createApp()` creates a NestJS application wrapping the Express platform.
    - Global Validation Pipe: Verifies that `ValidationPipe` is registered globally with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
    - CORS Configuration: Verifies that `app.enableCors()` is called with `credentials: true` and `origin: true`.
    - Port Binding Resolution:
      - Uses `process.env.NEW_BACKEND_PORT` when defined.
      - Falls back to `process.env.BACKEND_PORT` when defined and `NEW_BACKEND_PORT` is absent.
      - Falls back to `process.env.PORT` in production environments.
      - Defaults to port `8001` when no environment variables are specified (ensuring zero conflict with legacy monolith on `8000`).

- **`REQ-6` Runtime Main Entrypoint Unit Test Suite (`test/main.spec.ts`):**
  - Must define unit tests for `src/main.ts`:
    - Cloud Singleton Initialization: Verifies that `initializeFirebaseAdmin()` from `@journ/common` is called before server listening starts.
    - Safe Environment Loading: Verifies that `process.loadEnvFile()` is executed safely when supported by the Node.js runtime, without throwing unhandled exceptions if the file is absent.

- **`REQ-7` Structured Test Documentation & Classification:**
  - 100% of test cases across all staged suites must include standardized JSDoc blocks:
    - `@testType`: strictly `Unit Test` or `Integration Test`.
    - `@target`: specific class, function, module, or endpoint under test.
    - `@description`: clear explanation of test scenario and expected outcome.

- **`REQ-8` Monolith Non-Interference:**
  - Zero modifications to legacy files in `src/` or `frontend/`.
  - Legacy test suite (`npm test`) must continue passing with 100% success rate (32 suites, 172 tests).

### 1.4 Acceptance Criteria
- `AC-1` (Runner Isolation): Running `npm test` at workspace root discovers only legacy monolith tests (`src/`), ignoring `apps/backend/test/`.
- `AC-2` (Directory Mirroring): `apps/backend/test/` matches `apps/backend/src/` 1:1 (`app.module.spec.ts`, `bootstrap.spec.ts`, `main.spec.ts`).
- `AC-3` (AppModule DI Resolution): `test/app.module.spec.ts` specifies tests compiling `AppModule` and successfully resolving controllers from all six domain packages without dependency injection errors.
- `AC-4` (Security Guard & Route Mounting): `test/app.module.spec.ts` specifies integration tests confirming `GET /health` returns `200`, unauthenticated calls to protected routes return `401`, and `@Public()` endpoints bypass the auth guard.
- `AC-5` (Bootstrap Factory Tests): `test/bootstrap.spec.ts` specifies tests verifying global validation pipes, CORS configuration, and port precedence (`NEW_BACKEND_PORT` -> `BACKEND_PORT` -> `PORT` -> `8001`).
- `AC-6` (Main Entrypoint Tests): `test/main.spec.ts` specifies tests verifying Firebase Admin initialization and safe environment loading.
- `AC-7` (Metadata Compliance): 100% of test cases in all staged test files contain `@testType`, `@target`, and `@description` JSDoc annotations.
- `AC-8` (Non-Interference): `git status -s` shows 0 modified files in `src/` or `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Directory Mirroring & Test Layout Specification

#### 1.5.1 Structural Mirroring Map: `apps/backend`
The `apps/backend/test/` layout replicates the planned `apps/backend/src/` hierarchy 1:1:

```text
apps/backend/
├── src/                                                                # (Part 2 Implementation Target)
│   ├── app.module.ts                                                   # Root NestJS composition module
│   ├── bootstrap.ts                                                     # Express / Nest application factory
│   ├── main.ts                                                          # Runtime executable entrypoint
│   └── index.ts                                                        # Barrel export
└── test/                                                               # (Part 1 Staging Target)
    ├── app.module.spec.ts                                              # DI container compilation & routing [Integration Test]
    ├── bootstrap.spec.ts                                               # App factory, pipes, CORS & port fallback [Unit Test]
    ├── main.spec.ts                                                    # Firebase Admin init & env loading [Unit Test]
    └── setup.ts                                                        # Isolated test environment setup
```

#### 1.5.2 Test Code Commenting Syntax
Every test block must be preceded by a structured JSDoc block:

```typescript
/**
 * @testType Integration Test
 * @target AppModule
 * @description Verifies that the NestJS DI container compiles AppModule and resolves controllers from all 6 domain packages.
 */
it('should compile AppModule and resolve all domain controllers', async () => { ... });
```

```typescript
/**
 * @testType Unit Test
 * @target bootstrap / createApp
 * @description Verifies that ValidationPipe is registered with whitelist, forbidNonWhitelisted, and transform options.
 */
it('should configure global ValidationPipe with whitelist and transform', async () => { ... });
```

#### 1.5.3 Test Suites Breakdown

##### `apps/backend` Test Suites (12 Tests across 3 Files):

1. **`test/app.module.spec.ts` (`[Integration Test]`, 6 cases):**
   - Case 1: Compiles `AppModule` and resolves all six domain package controllers (`HealthController`, `AccountController`, `EntriesController`, `HabitMemoryController`, `ChatController`, `CronController`).
   - Case 2: Verifies `APP_FILTER` provides `DomainExceptionFilter`.
   - Case 3: Verifies `APP_GUARD` provides `FirebaseAuthGuard`.
   - Case 4: Responds with `200 OK` and `{ status: 'ok' }` on `GET /health` without credentials.
   - Case 5: Responds with `401 Unauthorized` on `GET /entries` when unauthenticated.
   - Case 6: Permits `@Public()` routes (`POST /cron/habit-memory`) to execute without bearer tokens.

2. **`test/bootstrap.spec.ts` (`[Unit Test]`, 4 cases):**
   - Case 1: Creates an Express-backed NestJS application instance.
   - Case 2: Configures global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
   - Case 3: Enables CORS with `credentials: true`.
   - Case 4: Resolves listen port with fallback precedence (`NEW_BACKEND_PORT` -> `BACKEND_PORT` -> `PORT` -> `8001`).

3. **`test/main.spec.ts` (`[Unit Test]`, 2 cases):**
   - Case 1: Calls `initializeFirebaseAdmin()` from `@journ/common` prior to launching the server.
   - Case 2: Attempts `process.loadEnvFile()` safely and catches file-not-found errors without process termination.

### 1.6 Edge Cases & Failure Modes
- **Circular Dependency During Module Import:**
  - If any two packages have circular module references at the root level, NestJS throws `CircularDependencyException`. Staged container integration test in `test/app.module.spec.ts` detects this immediately during test module compilation.
- **Missing Peer Providers:**
  - If a domain package relies on a token (e.g. `AIProvider`, `FIRESTORE_INSTANCE`) that is not exported by its owning module, compilation fails. The DI integration test validates that all imported modules self-contain or correctly export their dependencies.
- **Port Conflict with Monolith:**
  - If `apps/backend` defaults to `8000`, running both the legacy monolith and `apps/backend` simultaneously causes an `EADDRINUSE` collision. Defaulting port to `8001` eliminates this conflict.
- **Leaked Firebase Admin Singletons:**
  - Running container tests without mocked Firebase Admin instances could trigger `App already initialized` or network timeout errors. `test/setup.ts` isolates all Firebase Admin singletons globally.

### 1.7 Assumptions & Open Questions
- **Assumptions:**
  - `apps/backend` will be treated as an npm workspace package named `@journ/backend`, consuming `@journ/*` workspace packages via `"@journ/<pkg>": "*"`.
  - The legacy monolith in `src/` continues operating on port `8000` until Phase 7 cutover.
  - Production source code under `apps/backend/src/` is deferred strictly to Part 2 (`phase6-002`).
- **Open Questions:**
  - None. Scope and boundaries between Part 1 (test suites) and Part 2 (production composition root) are strictly defined.

---

## 2. Plan (How)

### 2.1 Files and Components to Add or Change
- **`apps/backend/package.json`**:
  - Private workspace manifest declaring `@journ/backend`.
  - Dependencies: `@journ/common`, `@journ/account`, `@journ/entries`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`, `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `reflect-metadata`.
  - Scripts: `build`, `start`, `start:dev`, `test`.
- **`apps/backend/tsconfig.json`**:
  - Extends root `../../tsconfig.base.json`.
  - Configures module resolution and targets `<rootDir>/src` and `<rootDir>/test`.
- **`apps/backend/jest.config.js`**:
  - Scopes test discovery strictly to `roots: ['<rootDir>/test']` with `testMatch: ['**/*.spec.ts']`.
  - Resolves workspace module aliases (`@journ/backend`, `@journ/*`) and registers setup files.
- **`apps/backend/test/setup.ts`**:
  - Sets up global test environment mocks for Firebase Admin SDK singletons (`getAuth`, `getFirestore`) and Google Cloud Vertex/GenAI SDK clients.
- **`apps/backend/test/app.module.spec.ts`**:
  - Staged integration test suite verifying NestJS `AppModule` DI container compilation, controller resolution, global filter binding, and guard enforcement on endpoints.
- **`apps/backend/test/bootstrap.spec.ts`**:
  - Staged unit test suite for application factory (`createApp`) verifying `ValidationPipe` registration, CORS setup, and port resolution fallback.
- **`apps/backend/test/main.spec.ts`**:
  - Staged unit test suite verifying `initializeFirebaseAdmin()` invocation and safe `.env` handling.

### 2.2 Data Models, Interfaces, and Contracts
- **Composition Root Modules:** `CommonModule`, `AccountModule`, `EntriesModule`, `HabitMemoryModule`, `ChatModule`, `CronModule`.
- **Controllers Resolved:** `HealthController`, `AccountController`, `EntriesController`, `HabitMemoryController`, `ChatController`, `CronController`.
- **Global Providers:** `APP_FILTER` bound to `DomainExceptionFilter`, `APP_GUARD` bound to `FirebaseAuthGuard`.
- **Bootstrap Factory Contract:**
  ```typescript
  export async function createApp(): Promise<INestApplication>;
  export function resolvePort(): number;
  export async function bootstrap(): Promise<void>;
  ```

### 2.3 Dependencies
- **Workspace Packages:**
  - `@journ/common`: Global filters, auth guards, health route, Firebase initialization.
  - `@journ/account`: Account and auth controllers and services.
  - `@journ/entries`: Entries controllers, repositories, vector search.
  - `@journ/habit-memory`: Habit memory controllers, cron routines, stores.
  - `@journ/chat`: Chat controllers, streaming service, sessions.
  - `@journ/cron`: Scheduler webhook controllers.
- **Root Hoisted Dependencies:**
  - `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/testing`, `supertest`, `reflect-metadata`, `jest`, `ts-jest`, `typescript`.
- Zero new external npm dependencies required.

### 2.4 Risks & Trade-offs
- **Risk:** Jest runner collision between legacy monolith runner and `apps/backend` runner.
  - **Mitigation:** Legacy `jest.config.js` restricts discovery to `roots: ['<rootDir>/src']`. `apps/backend/jest.config.js` restricts discovery strictly to `roots: ['<rootDir>/test']`.
- **Risk:** Unmocked Firebase Admin singletons causing network timeouts or duplicate initialization errors during testing.
  - **Mitigation:** Global mock setup in `apps/backend/test/setup.ts` isolates all Firebase Admin and Vertex AI clients.
- **Risk:** Port conflict if `apps/backend` accidentally binds to `8000` while legacy monolith is running.
  - **Mitigation:** Port resolution defaults to `8001` (`process.env.NEW_BACKEND_PORT || process.env.BACKEND_PORT || 8001`).

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Runner Isolation) | Execution of root `npm test` verifying 0 `apps/backend/test/` tests executed |
| `REQ-2` (Directory Mirroring) | Inspection of `apps/backend/test/` matching planned `apps/backend/src/` path-for-path |
| `REQ-3` (AppModule DI Container) | `apps/backend/test/app.module.spec.ts` (Cases 1-3) |
| `REQ-4` (Routing & Guards) | `apps/backend/test/app.module.spec.ts` (Cases 4-6) |
| `REQ-5` (Bootstrap Factory) | `apps/backend/test/bootstrap.spec.ts` (Cases 1-4) |
| `REQ-6` (Main Entrypoint) | `apps/backend/test/main.spec.ts` (Cases 1-2) |
| `REQ-7` (Structured Test Documentation) | Verification of `@testType`, `@target`, `@description` across all 3 test files |
| `REQ-8` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites (172 tests) with zero changes in `src/` |

---

## 3. Tasks

- [x] **Task 1: Scaffold Package Configuration & Runner Isolation for `@journ/backend` (`REQ-1`)**
  - Create `apps/backend/package.json` declaring `@journ/backend`, scripts (`build`, `test`, `start`), and dependencies.
  - Create `apps/backend/tsconfig.json` extending root `tsconfig.base.json`.
  - Create `apps/backend/jest.config.js` scoped strictly to `<rootDir>/test`.
  - Create `apps/backend/test/setup.ts` with global mocks for Firebase Admin and Google Cloud clients.
  - Run `npm install` at workspace root to register `@journ/backend` in npm workspaces.
  - *Done when:* `npm query .workspace` returns `@journ/backend`, and `jest.config.js` isolates test discovery to `<rootDir>/test`.

- [x] **Task 2: Stage AppModule DI Container & Route Integration Test Suite (`REQ-2`, `REQ-3`, `REQ-4`, `REQ-7`)**
  - Create `apps/backend/test/app.module.spec.ts`.
  - Stage 6 test cases: DI container compilation, controller resolution from all 6 packages, global filter binding, global guard binding, `GET /health` 200 OK, unauthenticated protected 401s, and `@Public()` route bypass.
  - Annotate 100% of cases with `@testType Integration Test`, `@target`, and `@description`.
  - *Done when:* File exists under `apps/backend/test/` with all 6 annotated integration test cases.

- [x] **Task 3: Stage Application Bootstrap Factory Unit Test Suite (`REQ-2`, `REQ-5`, `REQ-7`)**
  - Create `apps/backend/test/bootstrap.spec.ts`.
  - Stage 4 test cases: Express app creation, global `ValidationPipe` configuration, CORS configuration, and port fallback precedence (`NEW_BACKEND_PORT` -> `BACKEND_PORT` -> `PORT` -> `8001`).
  - Annotate 100% of cases with `@testType Unit Test`, `@target`, and `@description`.
  - *Done when:* File exists under `apps/backend/test/` with all 4 annotated unit test cases.

- [x] **Task 4: Stage Runtime Main Entrypoint Unit Test Suite (`REQ-2`, `REQ-6`, `REQ-7`)**
  - Create `apps/backend/test/main.spec.ts`.
  - Stage 2 test cases: `initializeFirebaseAdmin()` invocation and safe `.env` loading.
  - Annotate 100% of cases with `@testType Unit Test`, `@target`, and `@description`.
  - *Done when:* File exists under `apps/backend/test/` with all 2 annotated unit test cases.

- [x] **Task 5: Audit Test Code Commenting & Structural Mirroring Compliance (`REQ-2`, `REQ-7`)**
  - Audit all 3 staged test files in `apps/backend/test/` for 100% compliance with JSDoc annotations and 1:1 mirroring against planned `apps/backend/src/`.
  - *Done when:* Zero test cases lack standard JSDoc headers, and all 3 test files mirror `src/` path-for-path.

- [x] **Task 6: Verify Monolith Non-Interference (`REQ-8`)**
  - Check `git status -s` ensuring zero changes to `src/` or `frontend/`.
  - Execute root `npm test`.
  - *Done when:* Root test runner executes all 32 legacy test suites (172 tests) with 100% pass rate.
