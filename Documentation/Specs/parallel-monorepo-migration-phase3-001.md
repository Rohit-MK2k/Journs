# Parallel Monorepo Migration Phase 3 (Part 1) — `@journ/entries` Test Suite Specification
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-10-28

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 3 of the Parallel Monorepo Migration Plan extracts the core journaling domain (`src/entries/`) into an isolated workspace package (`packages/entries/`). In Journ's architecture, the Entries domain represents the central business capability ("The Cake"): recording written thoughts, managing attachments, compiling reading timelines, running semantic vector searches, and handling orphan asset garbage collection.

Following the Spec-Driven Development (SDD) paradigm and the Strangler Fig pattern established in Phase 1 (`@journ/common`) and Phase 2 (`@journ/account`), Phase 3 is partitioned into two distinct stages:
- **Part 1 (this specification):** Scaffolding workspace configuration (`package.json`, `tsconfig.json`, `jest.config.js`, `test/setup.ts`) and staging decoupled test suites in `packages/entries/test/` with standardized metadata annotations (`@testType`, `@target`, `@description`) and strict 1:1 directory mirroring of the planned `packages/entries/src/` hierarchy.
- **Part 2 (subsequent specification):** Implementing production domain models, services, repositories, vector search adapters, presentation controllers, DTOs, and module wiring in `packages/entries/src/`, resolving independent builds and verifying zero regressions on the legacy monolith.

The goal of this Part 1 specification is to define the isolated test runner environment and explicit test cases for `@journ/entries` prior to writing production code, guaranteeing runner isolation, strict directory mirroring, and contract adherence.

### 1.2 Scope
- **In Scope:**
  - Workspace package manifest for `packages/entries/package.json` declaring `@journ/entries` with dedicated `build` and `test` scripts.
  - TypeScript compiler configuration in `packages/entries/tsconfig.json` extending root `tsconfig.base.json`.
  - Dedicated Jest configuration in `packages/entries/jest.config.js` scoped strictly to `<rootDir>/test` with module aliases for `@journ/entries` and `@journ/common`.
  - Global test mock setup in `packages/entries/test/setup.ts` to mock Firebase Admin SDK singletons.
  - Strict 1:1 directory layout mirroring between `packages/entries/test/` and the planned `packages/entries/src/` structure (`services/`, `presentation/controllers/`, `presentation/dto/`, `infrastructure/repositories/`, `infrastructure/providers/`).
  - Staging decoupled unit test suites for:
    - Entry domain service (`test/services/entry.service.spec.ts`).
    - Semantic search domain service (`test/services/semantic-search.service.spec.ts`).
    - Attachment cleanup cron service (`test/services/attachment-cleanup-cron.service.spec.ts`).
    - Entries REST controller (`test/presentation/controllers/entries.controller.spec.ts`).
    - Semantic search REST controller (`test/presentation/controllers/search.controller.spec.ts`).
    - Create entry DTO validation (`test/presentation/dto/create-entry.dto.spec.ts`).
    - Update entry DTO validation (`test/presentation/dto/update-entry.dto.spec.ts`).
    - Firestore entry repository (`test/infrastructure/repositories/firestore-entry.repository.spec.ts`).
    - Firestore pending attachment repository (`test/infrastructure/repositories/firestore-pending-attachment.repository.spec.ts`).
    - Firestore cosine vector search provider (`test/infrastructure/providers/firestore-cosine-vector-search.provider.spec.ts`).
    - Vertex AI vector search provider (`test/infrastructure/providers/vertex-vector-search.provider.spec.ts`).
  - Staging decoupled integration test suite for:
    - NestJS module container wiring and provider resolution (`test/entries.module.spec.ts`).
  - Mandatory JSDoc metadata annotations (`@testType`, `@target`, `@description`) across all staged test cases matching Phase 1 and Phase 2 standards.

- **Explicitly Out of Scope:**
  - Implementing production classes under `packages/entries/src/` (deferred strictly to Part 2).
  - Modifying or deleting any file within legacy `src/` or `frontend/`.
  - Adding dependencies on peer feature packages (`@journ/account`, `@journ/habit-memory`, `@journ/chat`, `@journ/cron`).
  - Wiring composition roots in `apps/` (Phase 6).

### 1.3 Requirements
- **`REQ-1` Package Configuration & Test Runner Isolation:**
  - `packages/entries/package.json` must configure `@journ/entries` as a private workspace package with dependencies on `@journ/common` (`*`) and required peer/dev dependencies.
  - `packages/entries/jest.config.js` must restrict test discovery strictly to `roots: ['<rootDir>/test']` with module aliases mapping `@journ/entries/(.*)` to `<rootDir>/src/$1` and `@journ/entries` to `<rootDir>/src/index`.
  - Root `jest.config.js` (`roots: ['<rootDir>/src']`) must remain completely insulated from `packages/entries/test/`.

- **`REQ-2` Strict Directory Layout Mirroring:**
  - The directory hierarchy of `packages/entries/test/` must strictly mirror `packages/entries/src/` path-for-path across all subdirectories (`services/`, `presentation/controllers/`, `presentation/dto/`, `infrastructure/repositories/`, `infrastructure/providers/`).
  - Every test file must reside in the exact mirrored path corresponding to its future production target file.
  - Legacy test files located in the root `src/entries/__tests__/` folder (`entry.service.spec.ts`, `semantic-search.service.spec.ts`) must be relocated into `packages/entries/test/services/` to enforce 1:1 parity with their production targets in `packages/entries/src/services/`.

- **`REQ-3` Entry Service Test Suite (`test/services/entry.service.spec.ts`):**
  - Must define unit tests for `EntryService`:
    - Creating an entry with text and optional attachments.
    - Validating required text content and throwing `ValidationError` if empty or whitespace-only.
    - Resolving signed URLs for stored media attachments via `StorageProvider.getSignedReadUrl`.
    - Triggering asynchronous vector indexing via `VectorSearchProvider`.
    - Fetching timeline summaries formatted for display.
    - Editing existing entries and updating timestamps.

- **`REQ-4` Semantic Search Service Test Suite (`test/services/semantic-search.service.spec.ts`):**
  - Must define unit tests for `SemanticSearchService`:
    - Embedding natural language search queries via `AIProvider`.
    - Querying vector similarities via `VectorSearchProvider`.
    - Hydrating matched entry documents from `EntryRepository`.
    - Returning empty results gracefully when query string is empty or whitespace-only.

- **`REQ-5` Attachment Cleanup Cron Service Test Suite (`test/services/attachment-cleanup-cron.service.spec.ts`):**
  - Must define unit tests for `AttachmentCleanupCronService`:
    - Querying orphan attachment records created prior to today's start (`00:00:00`).
    - Purging orphaned files from Cloud Storage via `StorageProvider.deleteFile`.
    - Removing cleared orphan records from `PendingAttachmentRepository`.
    - Ensuring deletion failures on individual files do not halt cleanup of subsequent orphan files.

- **`REQ-6` Presentation Controllers & DTO Validation Test Suites:**
  - `test/presentation/controllers/entries.controller.spec.ts`:
    - Unit tests for `createEntry`, `getTimeline`, `getEntry`, `editEntry`, and upload URL generation.
  - `test/presentation/controllers/search.controller.spec.ts`:
    - Unit tests for `semanticSearch` ensuring query dispatch and empty-query guarding.
  - `test/presentation/dto/create-entry.dto.spec.ts`:
    - Unit tests validating text presence and polymorphic attachment schemas (`photo`, `voice`, `location`).
  - `test/presentation/dto/update-entry.dto.spec.ts`:
    - Unit tests validating update constraints.

- **`REQ-7` Infrastructure Repositories & Providers Test Suites:**
  - `test/infrastructure/repositories/firestore-entry.repository.spec.ts`:
    - Unit tests asserting Firestore document CRUD under subcollection `users/{uid}/entries`.
  - `test/infrastructure/repositories/firestore-pending-attachment.repository.spec.ts`:
    - Unit tests asserting creation, deletion, and orphan querying under `pending_attachments`.
  - `test/infrastructure/providers/firestore-cosine-vector-search.provider.spec.ts`:
    - Unit tests asserting 768-dimensional embedding generation and in-memory cosine distance ranking.
  - `test/infrastructure/providers/vertex-vector-search.provider.spec.ts`:
    - Unit tests asserting Vertex AI index upsert, neighbor querying, and datapoint removal.

- **`REQ-8` Entries Module Integration Test Suite (`test/entries.module.spec.ts`):**
  - Must define integration test using `@nestjs/testing` (`Test.createTestingModule`).
  - Must verify that `EntriesModule` compiles and resolves `EntriesController`, `SearchController`, `EntryService`, `SemanticSearchService`, `AttachmentCleanupCronService`, `'EntryRepository'`, `'PendingAttachmentRepository'`, and `'VectorSearchProvider'`.

- **`REQ-9` Structured Test Documentation & Classification:**
  - 100% of test cases across all staged suites must include structured JSDoc headers:
    - `@testType`: strictly `Unit Test` or `Integration Test`.
    - `@target`: specific class, method, DTO, or module under test.
    - `@description`: clear explanation of the scenario and expected outcome.

- **`REQ-10` Monolith Non-Interference:**
  - Running root `npm test` must continue executing legacy monolith tests in `src/` with 100% pass rate (32 suites, 172 tests).
  - Zero files within `src/` or `frontend/` may be added, modified, or deleted.

### 1.4 Acceptance Criteria
- **`AC-1` (Runner Isolation):** Running `npm test` at workspace root discovers and runs only legacy monolith tests (`src/`), ignoring `packages/entries/test/`.
- **`AC-2` (Directory Mirroring):** `packages/entries/test/` structure matches `packages/entries/src/` path-for-path across all subdirectories (`services/`, `presentation/controllers/`, `presentation/dto/`, `infrastructure/repositories/`, `infrastructure/providers/`).
- **`AC-3` (Entry Service Tests):** `test/services/entry.service.spec.ts` specifies tests covering entry creation, update, retrieval, attachments, and async vector indexing.
- **`AC-4` (Semantic Search Tests):** `test/services/semantic-search.service.spec.ts` specifies tests covering query embedding, vector recall, and hydration.
- **`AC-5` (Cron Cleanup Tests):** `test/services/attachment-cleanup-cron.service.spec.ts` specifies tests covering orphan detection, storage deletion, and resilient batch handling.
- **`AC-6` (Presentation & DTO Tests):** `test/presentation/` suites specify tests covering `EntriesController`, `SearchController`, `CreateEntryDto`, and `UpdateEntryDto`.
- **`AC-7` (Infrastructure Tests):** `test/infrastructure/` suites specify tests covering Firestore repositories and vector search providers (Firestore Cosine & Vertex AI).
- **`AC-8` (Module Wiring Integration):** `test/entries.module.spec.ts` compiles `EntriesModule` and resolves all registered controllers, services, and repository tokens.
- **`AC-9` (Metadata Compliance):** 100% of test cases in `packages/entries/test/` contain `@testType`, `@target`, and `@description` JSDoc annotations.
- **`AC-10` (Monolith Non-Interference):** `git status -s` shows 0 modified files in `src/` or `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Directory Mirroring & Test Layout Specification

#### 1.5.1 Structural Mirroring Map
The `packages/entries/test/` layout must replicate the internal folder hierarchy of `packages/entries/src/` 1:1. Legacy test placement anomalies (such as tests placed in a flat `__tests__/` directory) are rectified to match their exact production target paths:

```text
packages/entries/
├── src/                                                                # (Part 2 Implementation Target)
│   ├── domain/
│   │   ├── attachment.ts
│   │   ├── entry-summary.ts
│   │   ├── entry.ts
│   │   ├── index.ts
│   │   ├── pending-attachment.entity.ts
│   │   ├── semantic-search-result.ts
│   │   └── vector-search-result.ts
│   ├── infrastructure/
│   │   ├── providers/
│   │   │   ├── firestore-cosine-vector-search.provider.ts
│   │   │   ├── vertex-vector-search.provider.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── firestore-entry.repository.ts
│   │   │   ├── firestore-pending-attachment.repository.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── interfaces/
│   │   ├── entry-repository.interface.ts
│   │   ├── pending-attachment-repository.interface.ts
│   │   ├── vector-search-provider.interface.ts
│   │   └── index.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── entries.controller.ts
│   │   │   ├── search.controller.ts
│   │   │   └── index.ts
│   │   ├── dto/
│   │   │   ├── create-attachment.dto.ts
│   │   │   ├── create-entry.dto.ts
│   │   │   ├── update-entry.dto.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── attachment-cleanup-cron.service.ts
│   │   ├── entry.service.ts
│   │   ├── semantic-search.service.ts
│   │   └── index.ts
│   ├── entries.module.ts
│   └── index.ts
└── test/                                                               # (Part 1 Staging Target)
    ├── infrastructure/
    │   ├── providers/
    │   │   ├── firestore-cosine-vector-search.provider.spec.ts         # Mirrors src/infrastructure/providers/
    │   │   └── vertex-vector-search.provider.spec.ts                  # Mirrors src/infrastructure/providers/
    │   └── repositories/
    │       ├── firestore-entry.repository.spec.ts                     # Mirrors src/infrastructure/repositories/
    │       └── firestore-pending-attachment.repository.spec.ts        # Mirrors src/infrastructure/repositories/
    ├── presentation/
    │   ├── controllers/
    │   │   ├── entries.controller.spec.ts                             # Mirrors src/presentation/controllers/
    │   │   └── search.controller.spec.ts                              # Mirrors src/presentation/controllers/
    │   └── dto/
    │       ├── create-entry.dto.spec.ts                               # Mirrors src/presentation/dto/
    │       └── update-entry.dto.spec.ts                               # Mirrors src/presentation/dto/
    ├── services/
    │   ├── attachment-cleanup-cron.service.spec.ts                    # Mirrors src/services/
    │   ├── entry.service.spec.ts                                      # Mirrors src/services/
    │   └── semantic-search.service.spec.ts                            # Mirrors src/services/
    ├── entries.module.spec.ts                                         # Mirrors src/entries.module.ts
    └── setup.ts                                                       # Global Firebase Admin SDK test setup
```

#### 1.5.2 Test Code Commenting Syntax (Matching Phase 1 & 2 Format)
Every test block must be preceded by a structured JSDoc block:

```typescript
/**
 * @testType Unit Test
 * @target EntryService.createEntry
 * @description Verifies that a valid journal entry is persisted, attachments are linked, and vector indexing is scheduled asynchronously.
 */
it('should create an entry and trigger vector indexing', async () => { ... });
```

For module integration tests:

```typescript
/**
 * @testType Integration Test
 * @target EntriesModule
 * @description Verifies that the NestJS DI container compiles EntriesModule and successfully resolves all controllers, services, and repository tokens.
 */
it('should compile EntriesModule and resolve controllers and providers', async () => { ... });
```

#### 1.5.3 Test Suites Breakdown
1. **`test/services/entry.service.spec.ts` (`[Unit Test]`):**
   - Asserts entry creation persists to `EntryRepository.save`.
   - Asserts validation rejects empty or whitespace-only text with `ValidationError`.
   - Asserts signed URLs for attached media are fetched via `StorageProvider.getSignedReadUrl`.
   - Asserts `VectorSearchProvider.indexEntry` is triggered asynchronously.
   - Asserts timeline summaries are mapped to `EntrySummary` records.
   - Asserts entry updates update timestamps and re-index vectors.
2. **`test/services/semantic-search.service.spec.ts` (`[Unit Test]`):**
   - Asserts query embedding generation via `AIProvider`.
   - Asserts vector search query invocation via `VectorSearchProvider`.
   - Asserts entry hydration from `EntryRepository.findById`.
   - Asserts empty results returned for empty/whitespace query strings.
3. **`test/services/attachment-cleanup-cron.service.spec.ts` (`[Unit Test]`):**
   - Asserts discovery of orphans created before today's start (`00:00:00`).
   - Asserts file deletion via `StorageProvider.deleteFile`.
   - Asserts pending record removal via `PendingAttachmentRepository.delete`.
   - Asserts deletion failures on individual files do not abort subsequent orphan purges.
4. **`test/presentation/controllers/entries.controller.spec.ts` (`[Unit Test]`):**
   - Asserts `POST /entries` delegates to `entryService.createEntry`.
   - Asserts `GET /entries/timeline` returns timeline list for authenticated `uid`.
   - Asserts `GET /entries/:id` returns hydrated entry.
   - Asserts `PUT /entries/:id` updates entry.
   - Asserts `POST /entries/attachment-upload-url` generates signed upload URL and stages pending attachment.
5. **`test/presentation/controllers/search.controller.spec.ts` (`[Unit Test]`):**
   - Asserts `GET /entries/search` queries `semanticSearchService.search`.
   - Asserts empty string guard returns empty array without calling search service.
6. **`test/presentation/dto/create-entry.dto.spec.ts` (`[Unit Test]`):**
   - Asserts valid payload with and without attachments passes validation.
   - Asserts missing/empty `text` fails validation.
   - Asserts polymorphic attachments (`photo`, `voice`, `location`) validate schemas and reject invalid types.
7. **`test/presentation/dto/update-entry.dto.spec.ts` (`[Unit Test]`):**
   - Asserts update payload validation rules.
8. **`test/infrastructure/repositories/firestore-entry.repository.spec.ts` (`[Unit Test]`):**
   - Asserts Firestore operations target collection `users/{uid}/entries`.
   - Asserts `save`, `findById`, `findByDate`, `listByUser`, `update`, `delete`, and `deleteAll`.
9. **`test/infrastructure/repositories/firestore-pending-attachment.repository.spec.ts` (`[Unit Test]`):**
   - Asserts operations target collection `pending_attachments`.
   - Asserts `create`, `delete`, `deleteMany`, `findOrphansBefore`, and `deleteByUrlsOrPaths`.
10. **`test/infrastructure/providers/firestore-cosine-vector-search.provider.spec.ts` (`[Unit Test]`):**
    - Asserts 768-dimensional embedding generation via Gemini client.
    - Asserts cosine distance computation across entries.
    - Asserts skipping indexing when entry text is empty.
11. **`test/infrastructure/providers/vertex-vector-search.provider.spec.ts` (`[Unit Test]`):**
    - Asserts embedding generation and `IndexServiceClient.upsertDatapoints`.
    - Asserts nearest-neighbor lookup via `MatchServiceClient.findNeighbors`.
    - Asserts datapoint removal via `IndexServiceClient.removeDatapoints`.
12. **`test/entries.module.spec.ts` (`[Integration Test]`):**
    - Asserts DI container compilation and provider resolution for all registered tokens.

### 1.6 Edge Cases & Failure Modes
- **Decoupled Boundary Contracts:** `EntryService` and `SemanticSearchService` must depend on `AIProvider` and `StorageProvider` contracts from `@journ/common` rather than concrete classes or legacy `src/common/` paths.
- **Runner Cross-Contamination:** Root `jest.config.js` uses `roots: ['<rootDir>/src']` and `testMatch: ['**/__tests__/**/*.spec.ts']`. The new package test files reside under `packages/entries/test/*.spec.ts`, preventing accidental double execution by the legacy runner.
- **Premature Implementation Guard:** No production code in `packages/entries/src/` will be generated during Part 1. Production code is strictly deferred to Part 2.

### 1.7 Assumptions & Open Questions
- **Assumption:** External dependencies (`@nestjs/common`, `@nestjs/testing`, `firebase-admin`, `@google-cloud/aiplatform`) are hoisted from root `node_modules`.
- **Assumption:** Shared base configuration (`tsconfig.base.json`) and foundation package (`@journ/common`) are compiled and available in the workspace.
- **Open Questions:** None. Staged test suites mirror existing capabilities in `src/entries/` while standardizing annotations and isolating runner configurations.

---

## 2. Plan (How)

### 2.1 Files and Components to Add
- `packages/entries/package.json`: Private workspace package definition declaring `@journ/entries`, scripts (`build`, `test`), and dependency on `@journ/common`.
- `packages/entries/tsconfig.json`: TypeScript configuration extending `../../tsconfig.base.json` targeting `<rootDir>/test` and `<rootDir>/src`.
- `packages/entries/jest.config.js`: Dedicated Jest configuration file scoped strictly to `<rootDir>/test` with module aliases and setup file.
- `packages/entries/test/setup.ts`: Global test setup mocking Firebase Admin SDK (`getFirestore`, `initializeApp`).
- `packages/entries/test/services/entry.service.spec.ts`: Unit tests for `EntryService` mirroring `src/services/entry.service.ts`.
- `packages/entries/test/services/semantic-search.service.spec.ts`: Unit tests for `SemanticSearchService` mirroring `src/services/semantic-search.service.ts`.
- `packages/entries/test/services/attachment-cleanup-cron.service.spec.ts`: Unit tests for `AttachmentCleanupCronService` mirroring `src/services/attachment-cleanup-cron.service.ts`.
- `packages/entries/test/presentation/controllers/entries.controller.spec.ts`: Unit tests for `EntriesController` mirroring `src/presentation/controllers/entries.controller.ts`.
- `packages/entries/test/presentation/controllers/search.controller.spec.ts`: Unit tests for `SearchController` mirroring `src/presentation/controllers/search.controller.ts`.
- `packages/entries/test/presentation/dto/create-entry.dto.spec.ts`: Unit tests for `CreateEntryDto` mirroring `src/presentation/dto/create-entry.dto.ts`.
- `packages/entries/test/presentation/dto/update-entry.dto.spec.ts`: Unit tests for `UpdateEntryDto` mirroring `src/presentation/dto/update-entry.dto.ts`.
- `packages/entries/test/infrastructure/repositories/firestore-entry.repository.spec.ts`: Unit tests for `FirestoreEntryRepository` mirroring `src/infrastructure/repositories/firestore-entry.repository.ts`.
- `packages/entries/test/infrastructure/repositories/firestore-pending-attachment.repository.spec.ts`: Unit tests for `FirestorePendingAttachmentRepository` mirroring `src/infrastructure/repositories/firestore-pending-attachment.repository.ts`.
- `packages/entries/test/infrastructure/providers/firestore-cosine-vector-search.provider.spec.ts`: Unit tests for `FirestoreCosineVectorSearchProvider` mirroring `src/infrastructure/providers/firestore-cosine-vector-search.provider.ts`.
- `packages/entries/test/infrastructure/providers/vertex-vector-search.provider.spec.ts`: Unit tests for `VertexAIVectorSearchProvider` mirroring `src/infrastructure/providers/vertex-vector-search.provider.ts`.
- `packages/entries/test/entries.module.spec.ts`: Integration tests for `EntriesModule` mirroring `src/entries.module.ts`.

### 2.2 Data Models, Interfaces, and Contracts
- Decoupled interface mocks used in tests:
  - `EntryRepository`: persistence contract for entry subcollections.
  - `PendingAttachmentRepository`: persistence contract for pending uploads.
  - `VectorSearchProvider`: vector indexing and search contract.
  - `AIProvider`: contract from `@journ/common` (`summarize`, `embedContent`, etc.).
  - `StorageProvider`: contract from `@journ/common` (`generateUploadUrl`, `getSignedReadUrl`, `deleteFile`).
- Domain exceptions imported from `@journ/common`: `ValidationError`, `NotFoundError`, `ConflictError`.

### 2.3 Dependencies
- `@journ/common`: workspace package dependency for shared errors and infrastructure contracts (`AIProvider`, `StorageProvider`).
- Root hoisted dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/testing`, `firebase-admin`, `@google-cloud/aiplatform`, `class-validator`, `class-transformer`, `reflect-metadata`, `jest`, `ts-jest`, `typescript`.
- Zero new external packages will be added.

### 2.4 Risks & Trade-offs
- **Risk:** Root Jest runner accidentally discovering and executing tests in `packages/entries/test/`.
  - **Mitigation:** Verified root `jest.config.js` sets `roots: ['<rootDir>/src']` and `testMatch: ['**/__tests__/**/*.spec.ts']`, completely isolating it from `packages/entries/test/*.spec.ts`.
- **Risk:** Premature generation of `packages/entries/src/` production files during Part 1.
  - **Mitigation:** Restricting Part 1 strictly to `packages/entries/package.json`, `tsconfig.json`, `jest.config.js`, `test/setup.ts`, and test files under `test/`. Production files remain deferred to Part 2.
- **Risk:** Firebase Admin singleton ESM import leakage (`jose`) during unit test execution.
  - **Mitigation:** Global mock configuration in `packages/entries/test/setup.ts` registered in `jest.config.js` via `setupFiles`.

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Runner Isolation) | Execution of root `npm test` verifying 0 package tests executed |
| `REQ-2` (Directory Mirroring) | Inspection of `packages/entries/test/` directory hierarchy |
| `REQ-3` (Entry Service) | `packages/entries/test/services/entry.service.spec.ts` |
| `REQ-4` (Semantic Search Service) | `packages/entries/test/services/semantic-search.service.spec.ts` |
| `REQ-5` (Cron Cleanup Service) | `packages/entries/test/services/attachment-cleanup-cron.service.spec.ts` |
| `REQ-6` (Presentation Controllers & DTOs) | `packages/entries/test/presentation/controllers/entries.controller.spec.ts`<br>`packages/entries/test/presentation/controllers/search.controller.spec.ts`<br>`packages/entries/test/presentation/dto/create-entry.dto.spec.ts`<br>`packages/entries/test/presentation/dto/update-entry.dto.spec.ts` |
| `REQ-7` (Infrastructure Repositories & Providers) | `packages/entries/test/infrastructure/repositories/firestore-entry.repository.spec.ts`<br>`packages/entries/test/infrastructure/repositories/firestore-pending-attachment.repository.spec.ts`<br>`packages/entries/test/infrastructure/providers/firestore-cosine-vector-search.provider.spec.ts`<br>`packages/entries/test/infrastructure/providers/vertex-vector-search.provider.spec.ts` |
| `REQ-8` (Entries Module Wiring) | `packages/entries/test/entries.module.spec.ts` |
| `REQ-9` (Comment Standards) | Verification of `@testType`, `@target`, `@description` across all 12 test files |
| `REQ-10` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites (172 tests) |

---

## 3. Tasks

- [x] **Task 1: Scaffold Package Configuration & Runner Isolation (`REQ-1`)**
  - Create `packages/entries/package.json`, `packages/entries/tsconfig.json`, `packages/entries/jest.config.js`, and `packages/entries/test/setup.ts`.
  - Run `npm install` at workspace root to register `@journ/entries` in npm workspaces.
  - *Done when:* `packages/entries/jest.config.js` is isolated to `<rootDir>/test`, `@journ/entries` appears in `npm query .workspace`, and root `npm test` ignores `packages/entries/`.

- [x] **Task 2: Stage Mirrored Domain Service Unit Tests (`REQ-2`, `REQ-3`, `REQ-4`, `REQ-5`, `REQ-9`)**
  - Create `packages/entries/test/services/entry.service.spec.ts`.
  - Create `packages/entries/test/services/semantic-search.service.spec.ts`.
  - Create `packages/entries/test/services/attachment-cleanup-cron.service.spec.ts`.
  - *Done when:* All 3 service test files exist under `packages/entries/test/services/` with 100% of test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 3: Stage Mirrored Presentation Controller & DTO Unit Tests (`REQ-2`, `REQ-6`, `REQ-9`)**
  - Create `packages/entries/test/presentation/controllers/entries.controller.spec.ts`.
  - Create `packages/entries/test/presentation/controllers/search.controller.spec.ts`.
  - Create `packages/entries/test/presentation/dto/create-entry.dto.spec.ts`.
  - Create `packages/entries/test/presentation/dto/update-entry.dto.spec.ts`.
  - *Done when:* All 4 presentation test files exist under `packages/entries/test/presentation/` with 100% of test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 4: Stage Mirrored Infrastructure Repository & Provider Unit Tests (`REQ-2`, `REQ-7`, `REQ-9`)**
  - Create `packages/entries/test/infrastructure/repositories/firestore-entry.repository.spec.ts`.
  - Create `packages/entries/test/infrastructure/repositories/firestore-pending-attachment.repository.spec.ts`.
  - Create `packages/entries/test/infrastructure/providers/firestore-cosine-vector-search.provider.spec.ts`.
  - Create `packages/entries/test/infrastructure/providers/vertex-vector-search.provider.spec.ts`.
  - *Done when:* All 4 infrastructure test files exist under `packages/entries/test/infrastructure/` with 100% of test cases annotated with `@testType Unit Test`, `@target`, and `@description`.

- [x] **Task 5: Stage Module Integration Test Suite (`REQ-2`, `REQ-8`, `REQ-9`)**
  - Create `packages/entries/test/entries.module.spec.ts` testing `EntriesModule` DI compilation and provider resolution.
  - *Done when:* File exists directly under `packages/entries/test/` with test case annotated with `@testType Integration Test`, `@target`, and `@description`.

- [x] **Task 6: Audit Test Code Commenting & Structural Mirroring Compliance (`REQ-2`, `REQ-9`)**
  - Review all 12 staged test files across `packages/entries/test/` to confirm 100% compliance with JSDoc headers (`@testType`, `@target`, `@description`) and exact 1:1 path mirroring against future `packages/entries/src/`.
  - *Done when:* Zero test cases in `packages/entries/test/` are missing standard JSDoc classification blocks, and all 12 test paths match their `src/` counterparts.

- [x] **Task 7: Verify Monolith Non-Interference (`REQ-10`)**
  - Run `git status -s` to verify zero modified files in `src/` or `frontend/`.
  - Run `npm test` across root workspace.
  - *Done when:* Root test runner executes all 32 legacy test suites (172 tests) with 100% pass rate.
