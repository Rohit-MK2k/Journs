# Parallel Monorepo Migration Phase 6 (Part 2) — `apps/backend` Production Composition Root Implementation
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-11-06

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 6 Part 1 (`Documentation/Specs/parallel-monorepo-migration-phase6-001.md`) established the package manifest, isolated Jest test runner, and 3 staged test suites (12 test cases) across `apps/backend/test/`.

The goal of Phase 6 Part 2 is to implement the production composition root and application bootstrap files in `apps/backend/src/` to satisfy all staged test suites, achieve clean independent TypeScript compilation, and complete the creation of the monorepo composition root.

Under the Strangler Fig pattern, the legacy monolith in `src/` remains untouched and continues running on port `8000` without modification or regression.

### 1.2 Scope
- **In Scope:**
  - Production composition root module in `apps/backend/src/app.module.ts`:
    - Importing all six workspace package modules: `CommonModule`, `AccountModule`, `EntriesModule`, `HabitMemoryModule`, `ChatModule`, `CronModule`.
    - Registering global providers: `APP_FILTER` bound to `DomainExceptionFilter` from `@journ/common` and `APP_GUARD` bound to `FirebaseAuthGuard` from `@journ/common`.
  - Production application bootstrap factory in `apps/backend/src/bootstrap.ts`:
    - `createApp()`: Instantiating the NestJS application wrapping the Express platform using `NestFactory.create(AppModule)`.
    - Registering global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
    - Enabling CORS with `origin: true` and `credentials: true`.
    - `resolvePort()`: Resolving listen port respecting priority: `NEW_BACKEND_PORT` -> `BACKEND_PORT` -> `PORT` -> default fallback `8001`.
    - `bootstrap()`: Creating app, resolving port, and starting HTTP listener on `0.0.0.0`.
  - Production runtime entrypoint in `apps/backend/src/main.ts`:
    - `loadEnvironment()`: Safely invoking `process.loadEnvFile()` when available, catching and suppressing missing file errors.
    - `run()`: Invoking `loadEnvironment()`, initializing Firebase Admin via `initializeFirebaseAdmin()` from `@journ/common`, and calling `bootstrap()`.
    - Direct execution check to auto-launch when executed as script.
  - Package public entry point in `apps/backend/src/index.ts`:
    - Re-exporting `AppModule`, `createApp`, `resolvePort`, `bootstrap`, `loadEnvironment`, and `run`.
  - Independent package compilation (`npm run build -w @journ/backend`):
    - Emitting clean `.js`, `.d.ts`, and `.map` files into `apps/backend/dist/` with 0 TypeScript compiler errors.
  - Independent package test execution (`npm test -w @journ/backend`):
    - Executing and passing all 3 staged test suites (12 test cases) with 100% pass rate.
  - Monolith non-interference verification (`npm test`):
    - Verifying all 32 legacy test suites (172 tests) continue passing with 100% pass rate.

- **Explicitly Out of Scope:**
  - Modifying, moving, or deleting any files in the legacy monolith `src/` or `frontend/`.
  - Modifying existing workspace packages in `packages/*`.
  - Phase 7 final cutover operations: moving `frontend/` to `apps/frontend/`, deleting legacy `src/`, or updating root `package.json` scripts (`start`, `build`, `dev`).

### 1.3 Requirements
- **`REQ-1` Production Composition Root Module (`apps/backend/src/app.module.ts`):**
  - Must declare `AppModule` decorated with `@Module`.
  - `imports` array must include:
    - `CommonModule` from `@journ/common`
    - `AccountModule` from `@journ/account`
    - `EntriesModule` from `@journ/entries`
    - `HabitMemoryModule` from `@journ/habit-memory`
    - `ChatModule` from `@journ/chat`
    - `CronModule` from `@journ/cron`
  - `providers` array must bind:
    - `{ provide: APP_FILTER, useClass: DomainExceptionFilter }`
    - `{ provide: APP_GUARD, useClass: FirebaseAuthGuard }`
  - Must export clean `AppModule` class.

- **`REQ-2` Application Bootstrap Factory (`apps/backend/src/bootstrap.ts`):**
  - Must implement and export `createApp()`:
    - Calls `NestFactory.create(AppModule)` to construct the Nest application instance.
    - Applies `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
    - Enables CORS with `origin: true` and `credentials: true`.
    - Returns the configured `INestApplication` instance without calling `app.listen()`.
  - Must implement and export `resolvePort()`:
    - Returns numeric port adhering strictly to precedence:
      1. `parseInt(process.env.NEW_BACKEND_PORT, 10)` if defined and valid.
      2. `parseInt(process.env.BACKEND_PORT, 10)` if defined and valid.
      3. `parseInt(process.env.PORT, 10)` if defined and valid.
      4. Fallback default `8001`.
  - Must implement and export `bootstrap()`:
    - Calls `createApp()`, resolves port via `resolvePort()`, and calls `await app.listen(port, '0.0.0.0')`.

- **`REQ-3` Runtime Entrypoint (`apps/backend/src/main.ts`):**
  - Must implement and export `loadEnvironment()`:
    - Safely checks for `process.loadEnvFile` and invokes it within `try / catch` so missing `.env` does not crash execution.
  - Must implement and export `run()`:
    - Calls `loadEnvironment()`.
    - Calls `initializeFirebaseAdmin()` from `@journ/common`.
    - Awaits `bootstrap()`.
  - Must execute `run()` when executed as main module.

- **`REQ-4` Package Barrel Export (`apps/backend/src/index.ts`):**
  - Must export `AppModule` from `./app.module`.
  - Must export `createApp`, `resolvePort`, and `bootstrap` from `./bootstrap`.
  - Must export `run` and `loadEnvironment` from `./main`.

- **`REQ-5` Independent Package Build & Staged Test Execution:**
  - `npm run build -w @journ/backend` must compile successfully with zero TypeScript diagnostics, outputting to `apps/backend/dist/`.
  - `npm test -w @journ/backend` must pass all 3 test suites (`test/app.module.spec.ts`, `test/bootstrap.spec.ts`, `test/main.spec.ts`) with 12/12 tests green.

- **`REQ-6` Monolith Non-Interference:**
  - Zero modifications to files in legacy `src/` or `frontend/`.
  - Root `npm test` must continue passing all 32 legacy suites (172 tests) with 100% pass rate.

### 1.4 Acceptance Criteria
- `AC-1` (AppModule Wiring): `AppModule` compiles cleanly, resolves all 6 domain modules, and mounts global `DomainExceptionFilter` and `FirebaseAuthGuard`.
- `AC-2` (Bootstrap Factory): `createApp()` returns configured app with validation pipes and CORS; `resolvePort()` adheres to port precedence defaulting to `8001`.
- `AC-3` (Main Entrypoint): `main.ts` executes environment loading, Firebase Admin initialization, and server bootstrap.
- `AC-4` (Public API): `index.ts` exports all root composition symbols.
- `AC-5` (Build & Test Pass Rate): `npm run build -w @journ/backend` generates `dist/` with 0 errors; `npm test -w @journ/backend` executes 12/12 tests with 100% pass rate.
- `AC-6` (Monolith Non-Interference): `git status -s` shows 0 modified files in `src/` or `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Target Source Layout & Component Specification

```text
apps/backend/
├── src/
│   ├── app.module.ts             # Root NestJS composition module (REQ-1)
│   ├── bootstrap.ts              # App factory, ValidationPipe, CORS, port fallback (REQ-2)
│   ├── main.ts                   # Firebase Admin init, env loading, launcher (REQ-3)
│   └── index.ts                  # Public package entry point (REQ-4)
└── test/                         # (Staged in Part 1)
    ├── app.module.spec.ts        # Tests app.module.ts
    ├── bootstrap.spec.ts         # Tests bootstrap.ts
    ├── main.spec.ts              # Tests main.ts
    └── setup.ts                  # Test mocks
```

### 1.6 Edge Cases & Failure Modes
- **Port Collision with Monolith:**
  - If both `apps/backend` and legacy `src/` run at the same time, defaulting `apps/backend` to `8001` prevents `EADDRINUSE`.
- **Missing Firebase Credentials in Local Dev:**
  - `initializeFirebaseAdmin()` from `@journ/common` handles missing credentials in development gracefully by falling back to local emulator or dummy configurations as established in Phase 1.
- **Node Runtime Missing `process.loadEnvFile`:**
  - `loadEnvironment()` guards the call with `typeof process.loadEnvFile === 'function'` ensuring backward compatibility on older Node versions.

### 1.7 Assumptions & Open Questions
- **Assumptions:**
  - All six `@journ/*` workspace packages are cleanly compiled or consumed via source aliases.
  - Final cutover to replace root scripts is deferred to Phase 7.
- **Open Questions:**
  - None. Requirements are fully specified from Part 1 test assertions.

---

## 2. Plan (How)

### 2.1 Files and Components to Add or Change
- **`apps/backend/src/app.module.ts`**:
  - Implements NestJS root module `AppModule`.
  - Imports `CommonModule`, `AccountModule`, `EntriesModule`, `HabitMemoryModule`, `ChatModule`, `CronModule`.
  - Registers `APP_FILTER` with `DomainExceptionFilter` and `APP_GUARD` with `FirebaseAuthGuard`.
- **`apps/backend/src/bootstrap.ts`**:
  - Implements `createApp()` wrapping `NestFactory.create(AppModule)` and attaching `ValidationPipe` and CORS.
  - Implements `resolvePort()` priority: `NEW_BACKEND_PORT` -> `BACKEND_PORT` -> `PORT` -> fallback `8001`.
  - Implements `bootstrap()` starting HTTP listener on `0.0.0.0:port`.
- **`apps/backend/src/main.ts`**:
  - Implements `loadEnvironment()` safely calling `process.loadEnvFile()`.
  - Implements `run()` executing environment load, Firebase Admin init, and server bootstrap.
  - Auto-executes `run()` if executed as main file.
- **`apps/backend/src/index.ts`**:
  - Re-exports symbols from `app.module.ts`, `bootstrap.ts`, and `main.ts`.

### 2.2 Data Models, Interfaces, and Contracts
- **`AppModule` Contract:** NestJS dynamic IoC root container.
- **Bootstrap Factory Contract:**
  ```typescript
  export async function createApp(): Promise<INestApplication>;
  export function resolvePort(): number;
  export async function bootstrap(): Promise<void>;
  ```
- **Runtime Entrypoint Contract:**
  ```typescript
  export function loadEnvironment(): void;
  export async function run(): Promise<void>;
  ```

### 2.3 Dependencies
- **Workspace Packages:**
  - `@journ/common`: Error filters, auth guards, health controller, Firebase config.
  - `@journ/account`: Account and auth modules.
  - `@journ/entries`: Entries module, repository, search.
  - `@journ/habit-memory`: Habit memory module, stores, crons.
  - `@journ/chat`: Chat module, sessions, AI interaction.
  - `@journ/cron`: Scheduler webhook module.
- **Runtime Dependencies:**
  - `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `reflect-metadata`.
- Zero new external dependencies.

### 2.4 Risks & Trade-offs
- **Risk:** Type error or broken import during package build.
  - **Mitigation:** Execute `npm run build -w @journ/backend` validating clean compilation to `dist/`.
- **Risk:** Discrepancy between staged test expectations and implementation.
  - **Mitigation:** Execute `npm test -w @journ/backend` verifying all 12 tests across all 3 staged suites pass green.
- **Risk:** Regressions in legacy monolith.
  - **Mitigation:** Leave legacy `src/` and `frontend/` untouched; verify with root `npm test` (32 suites, 172 tests).

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (AppModule Wiring) | `apps/backend/test/app.module.spec.ts` (6 cases) |
| `REQ-2` (Bootstrap Factory) | `apps/backend/test/bootstrap.spec.ts` (4 cases) |
| `REQ-3` (Main Entrypoint) | `apps/backend/test/main.spec.ts` (2 cases) |
| `REQ-4` (Public API Exports) | `npm run build -w @journ/backend` emitting clean typings |
| `REQ-5` (Build & Test Pass Rate) | `npm run build -w @journ/backend` & `npm test -w @journ/backend` |
| `REQ-6` (Monolith Non-Interference) | Root `npm test` passing 32/32 suites (172 tests) |

---

## 3. Tasks

- [x] **Task 1: Implement Composition Root Module (`apps/backend/src/app.module.ts`) (`REQ-1`)**
  - Create `apps/backend/src/app.module.ts` importing all 6 workspace packages and registering `APP_FILTER` and `APP_GUARD`.
  - *Done when:* `npm test -w @journ/backend apps/backend/test/app.module.spec.ts` passes all 6 tests green.

- [x] **Task 2: Implement Application Bootstrap Factory (`apps/backend/src/bootstrap.ts`) (`REQ-2`)**
  - Create `apps/backend/src/bootstrap.ts` implementing `createApp()`, `resolvePort()`, and `bootstrap()`.
  - *Done when:* `npm test -w @journ/backend apps/backend/test/bootstrap.spec.ts` passes all 4 tests green.

- [x] **Task 3: Implement Runtime Main Entrypoint (`apps/backend/src/main.ts`) (`REQ-3`)**
  - Create `apps/backend/src/main.ts` implementing `loadEnvironment()` and `run()`.
  - *Done when:* `npm test -w @journ/backend apps/backend/test/main.spec.ts` passes all 2 tests green.

- [x] **Task 4: Implement Package Barrel Export (`apps/backend/src/index.ts`) (`REQ-4`)**
  - Create `apps/backend/src/index.ts` exporting symbols from `app.module`, `bootstrap`, and `main`.
  - *Done when:* File exists and exports `AppModule`, `createApp`, `resolvePort`, `bootstrap`, `loadEnvironment`, and `run`.

- [x] **Task 5: Validate Independent Package Build & Staged Test Suites (`REQ-5`)**
  - Run `npm run build -w @journ/backend`.
  - Run `npm test -w @journ/backend`.
  - *Done when:* Build produces clean `dist/` with 0 compiler errors, and all 3 staged test suites (12 tests) pass 100% green.

- [x] **Task 6: Verify Monolith Non-Interference (`REQ-6`)**
  - Check `git status -s` ensuring zero changes to `src/` or `frontend/`.
  - Execute root `npm test`.
  - *Done when:* Root test runner executes all 32 legacy test suites (172 tests) with 100% pass rate.
