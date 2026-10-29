# Parallel Monorepo Migration Phase 3 (Part 2) — `@journ/entries` Production Code Extraction
- Status: Implemented
- Parent: Documentation/Specs/parallel-monorepo-migration-plan.md
- Created: 2026-10-28

---

## 1. Spec (What and Why)

### 1.1 Goal & Context
Phase 3 Part 1 (`Documentation/Specs/parallel-monorepo-migration-phase3-001.md`) established the package scaffolding, workspace linkage, runner isolation, and 12 staged test suites (85 test cases) in `packages/entries/test/`.

The goal of Phase 3 Part 2 is to extract and implement the production code in `packages/entries/src/` to satisfy all staged test suites, enable independent package build/test execution, and uphold strict Domain-Driven Design (DDD) layer separation and Dependency Inversion.

Under the Strangler Fig pattern, the legacy monolith in `src/entries/` remains completely untouched and continues functioning without modification or regression.

### 1.2 Scope
- **In Scope:**
  - Defining domain models and entities in `packages/entries/src/domain/`:
    - `entry.ts`: `Entry` entity representing core journal records.
    - `attachment.ts`: `Attachment` entity and helper types for polymorphic attachments (`photo`, `voice`, `location`).
    - `pending-attachment.entity.ts`: `PendingAttachment` entity tracking staged file uploads.
    - `entry-summary.ts`: `EntrySummary` view model for timeline reading.
    - `semantic-search-result.ts` & `vector-search-result.ts`: search domain models.
    - `index.ts`: barrel export for domain models.
  - Defining domain & provider contracts in `packages/entries/src/interfaces/`:
    - `entry-repository.interface.ts`: `EntryRepository` persistence contract.
    - `pending-attachment-repository.interface.ts`: `PendingAttachmentRepository` persistence contract.
    - `vector-search-provider.interface.ts`: `VectorSearchProvider` contract for embedding and similarity lookup.
    - `index.ts`: barrel export for interfaces.
  - Extracting core business logic in `packages/entries/src/services/`:
    - `entry.service.ts`: `EntryService` coordinating entry CRUD, attachment association, autosave with conflict detection, timeline compilation with cached AI summaries, and asynchronous vector indexing.
    - `semantic-search.service.ts`: `SemanticSearchService` handling query embedding, vector distance scoring, and semantic chip extraction.
    - `attachment-cleanup-cron.service.ts`: `AttachmentCleanupCronService` executing daily orphan attachment garbage collection.
    - `index.ts`: barrel export for services.
  - Extracting cloud infrastructure adapters in `packages/entries/src/infrastructure/`:
    - `repositories/firestore-entry.repository.ts`: `FirestoreEntryRepository` implementing `EntryRepository` for `users/{uid}/entries`.
    - `repositories/firestore-pending-attachment.repository.ts`: `FirestorePendingAttachmentRepository` implementing `PendingAttachmentRepository` for `pending_attachments`.
    - `providers/firestore-cosine-vector-search.provider.ts`: `FirestoreCosineVectorSearchProvider` implementing `VectorSearchProvider` using in-memory cosine distance and Gemini embeddings.
    - `providers/vertex-vector-search.provider.ts`: `VertexAIVectorSearchProvider` implementing `VectorSearchProvider` using Vertex AI Vector Search.
    - `index.ts`: barrel export for infrastructure.
  - Extracting presentation controllers & DTOs in `packages/entries/src/presentation/`:
    - `controllers/entries.controller.ts`: `EntriesController` handling `/entries` REST endpoints.
    - `controllers/search.controller.ts`: `SearchController` handling `/entries/search` REST endpoint.
    - `dto/create-entry.dto.ts`, `dto/create-attachment.dto.ts`, `dto/update-entry.dto.ts`: input validation schemas.
    - `index.ts`: barrel export for presentation.
  - Wiring NestJS module and public package API in:
    - `packages/entries/src/entries.module.ts`: `EntriesModule` configuring controllers, providers, and DI injection tokens (`'EntryRepository'`, `'PendingAttachmentRepository'`, `'VectorSearchProvider'`).
    - `packages/entries/src/index.ts`: public package entry point.
  - Independent package compilation (`npm run build -w @journ/entries`) emitting clean `.js` and `.d.ts` files to `packages/entries/dist/` with zero TypeScript errors.
  - Independent package test execution (`npm test -w @journ/entries`) passing all 12 staged test suites (85 test cases) with 100% pass rate.
  - Monolith non-interference verification (`npm test`).

- **Explicitly Out of Scope:**
  - Modifying or deleting any file within legacy `src/` or `frontend/`.
  - Modifying the staged test files in `packages/entries/test/`.
  - Extracting downstream domain packages (`@journ/habit-memory`, `@journ/chat`, `@journ/cron` — Phase 4+).
  - Wiring composition roots in `apps/` (Phase 6).

### 1.3 Requirements
- **`REQ-1` Domain Models & Contract Interfaces:**
  - `packages/entries/src/domain/` must define entities (`Entry`, `Attachment`, `PendingAttachment`, `EntrySummary`, `SemanticSearchResult`, `VectorSearchResult`).
  - `packages/entries/src/interfaces/` must define abstract contracts for `EntryRepository`, `PendingAttachmentRepository`, and `VectorSearchProvider`.
  - Contracts must consume external abstractions (`AIProvider`, `StorageProvider`) from `@journ/common` without referencing peer packages or legacy `src/common/`.

- **`REQ-2` Domain Services Implementation:**
  - `packages/entries/src/services/entry.service.ts` must implement `EntryService`:
    - Validation throwing `ValidationError` (from `@journ/common`) on empty/whitespace text.
    - CRUD persistence via `EntryRepository`.
    - Autosave with `lastAutosaveAt` and conflict detection throwing `ConflictError` on stale timestamps.
    - Timeline generation sorting entries newest-first, formatting previews with cached summaries, and skipping entries with 20 or fewer words.
    - Asynchronous vector indexing trigger via `VectorSearchProvider.indexEntry` without failing entry creation if indexing throws.
  - `packages/entries/src/services/semantic-search.service.ts` must implement `SemanticSearchService`:
    - Embedding generation and vector similarity search.
    - Distance to percentage match score mapping (`100 - (distance * 50)`).
    - Semantic chip extraction via `AIProvider.extractSemanticChips`.
  - `packages/entries/src/services/attachment-cleanup-cron.service.ts` must implement `AttachmentCleanupCronService`:
    - Finding orphan attachments before today's start (`00:00:00`).
    - Deleting files via `StorageProvider.deleteFile` and deleting records via `PendingAttachmentRepository.delete`.
    - Resilient error handling ensuring individual file deletion failures do not abort subsequent purges.

- **`REQ-3` Cloud Infrastructure Adapters:**
  - `packages/entries/src/infrastructure/repositories/firestore-entry.repository.ts` must implement `FirestoreEntryRepository` targeting `users/{uid}/entries`.
  - `packages/entries/src/infrastructure/repositories/firestore-pending-attachment.repository.ts` must implement `FirestorePendingAttachmentRepository` targeting `pending_attachments`.
  - `packages/entries/src/infrastructure/providers/firestore-cosine-vector-search.provider.ts` must implement `FirestoreCosineVectorSearchProvider` generating 768-dim embeddings via `gemini-embedding-2` and computing cosine distances.
  - `packages/entries/src/infrastructure/providers/vertex-vector-search.provider.ts` must implement `VertexAIVectorSearchProvider` managing Vertex AI Vector Search index datapoints and neighbor queries.

- **`REQ-4` Presentation Controllers & DTOs:**
  - `packages/entries/src/presentation/controllers/entries.controller.ts` must implement `EntriesController` (`POST /entries`, `GET /entries/timeline`, `GET /entries/:id`, `PUT /entries/:id`, `POST /entries/attachment-upload-url`, `POST /entries/:id/attachments`, `DELETE /entries/:id/attachments/:attachmentId`, `DELETE /entries/pending-attachments/:id`, `POST /entries/:id/summary`, `PATCH /entries/:id/autosave`).
  - `packages/entries/src/presentation/controllers/search.controller.ts` must implement `SearchController` (`GET /entries/search`).
  - `packages/entries/src/presentation/dto/` must implement `CreateEntryDto`, `UpdateEntryDto`, and attachment DTOs using `class-validator` and `class-transformer`.

- **`REQ-5` NestJS Module Wiring & Public API:**
  - `packages/entries/src/entries.module.ts` must declare `EntriesModule`:
    - Registers `EntriesController` and `SearchController`.
    - Binds `'EntryRepository'` to `FirestoreEntryRepository`.
    - Binds `'PendingAttachmentRepository'` to `FirestorePendingAttachmentRepository`.
    - Binds `'VectorSearchProvider'` to `FirestoreCosineVectorSearchProvider`.
    - Provides `EntryService` and `SemanticSearchService` using factory functions with token injection.
    - Provides `AttachmentCleanupCronService`.
    - Exports all services and interface tokens.
  - `packages/entries/src/index.ts` must export all public package symbols.

- **`REQ-6` Independent Package Build & Test Execution:**
  - `npm run build -w @journ/entries` must execute `tsc` and output clean `.js`, `.d.ts`, and `.map` files into `packages/entries/dist/` with zero TypeScript errors.
  - `npm test -w @journ/entries` must execute all 12 staged test suites (85 test cases) with 100% pass rate.

- **`REQ-7` Monolith Non-Interference:**
  - Zero files within `src/` or `frontend/` may be added, edited, or deleted.
  - Root `npm test` must continue passing all 32 legacy test suites (172 tests).

### 1.4 Acceptance Criteria
- **`AC-1` (Domain & Interfaces):** `packages/entries/src/domain/index.ts` and `src/interfaces/index.ts` export all types with zero peer package dependencies.
- **`AC-2` (Services):** `npm test -w @journ/entries packages/entries/test/services` passes all 3 test suites green.
- **`AC-3` (Infrastructure):** `npm test -w @journ/entries packages/entries/test/infrastructure` passes all 4 test suites green.
- **`AC-4` (Presentation):** `npm test -w @journ/entries packages/entries/test/presentation` passes all 4 test suites green.
- **`AC-5` (Module Integration):** `npm test -w @journ/entries packages/entries/test/entries.module.spec.ts` passes DI compilation and provider resolution.
- **`AC-6` (Independent Build & Full Test):** `npm run build -w @journ/entries` exits code 0; `npm test -w @journ/entries` runs 12 suites (85 tests) with 100% pass rate.
- **`AC-7` (Monolith Non-Interference):** `git status -s` shows 0 modified files in `src/` or `frontend/`; root `npm test` passes all 32 legacy suites (172 tests).

### 1.5 Edge Cases & Failure Modes
- **Optional Signed Read URLs:** When returning entries with media attachments, entries controller must resolve signed read URLs through `StorageProvider.getSignedReadUrl`. If an attachment has no stored path, it gracefully falls back to existing public URLs.
- **Decoupled Boundary Contracts:** `@journ/entries` interacts with AI and Cloud Storage exclusively through `AIProvider` and `StorageProvider` contracts from `@journ/common`.
- **Async Indexing Resilience:** Asynchronous background vector indexing errors in `entryService.createEntry` and `editEntry` must be caught and logged rather than causing the primary write operation to throw an unhandled rejection.

### 1.6 Assumptions & Open Questions
- **Assumption:** Third-party libraries (`@nestjs/common`, `firebase-admin`, `@google-cloud/aiplatform`, `class-validator`, `class-transformer`) are hoisted from the workspace root.
- **Assumption:** `@journ/common` is compiled and available in the workspace.
- **Open Questions:** None. Staged test suites in `packages/entries/test/` provide exact behavioral specifications.

---

## 2. Plan (How)

### 2.1 Files and Components to Add
- `packages/entries/src/domain/entry.ts`: Domain entity for `Entry`.
- `packages/entries/src/domain/attachment.ts`: Domain entity and helper types for `Attachment`.
- `packages/entries/src/domain/pending-attachment.entity.ts`: Domain entity for `PendingAttachment`.
- `packages/entries/src/domain/entry-summary.ts`: View model for `EntrySummary`.
- `packages/entries/src/domain/semantic-search-result.ts` & `vector-search-result.ts`: Search domain models.
- `packages/entries/src/domain/index.ts`: Barrel export for domain models.
- `packages/entries/src/interfaces/entry-repository.interface.ts`: Contract for entry storage operations.
- `packages/entries/src/interfaces/pending-attachment-repository.interface.ts`: Contract for pending attachment lifecycle.
- `packages/entries/src/interfaces/vector-search-provider.interface.ts`: Contract for vector indexing and search.
- `packages/entries/src/interfaces/index.ts`: Barrel export for interfaces.
- `packages/entries/src/services/entry.service.ts`: Core service for entry CRUD, timeline, autosave, and async vector indexing.
- `packages/entries/src/services/semantic-search.service.ts`: Core service for query embedding and semantic search.
- `packages/entries/src/services/attachment-cleanup-cron.service.ts`: Cron service for purging orphan uploads.
- `packages/entries/src/services/index.ts`: Barrel export for services.
- `packages/entries/src/infrastructure/repositories/firestore-entry.repository.ts`: Firestore persistence adapter for entries.
- `packages/entries/src/infrastructure/repositories/firestore-pending-attachment.repository.ts`: Firestore adapter for pending attachments.
- `packages/entries/src/infrastructure/repositories/index.ts`: Barrel export for repositories.
- `packages/entries/src/infrastructure/providers/firestore-cosine-vector-search.provider.ts`: In-memory cosine vector provider using Gemini embeddings.
- `packages/entries/src/infrastructure/providers/vertex-vector-search.provider.ts`: Vertex AI vector search provider adapter.
- `packages/entries/src/infrastructure/providers/index.ts`: Barrel export for providers.
- `packages/entries/src/infrastructure/index.ts`: Barrel export for infrastructure.
- `packages/entries/src/presentation/dto/create-entry.dto.ts`: DTO for entry creation.
- `packages/entries/src/presentation/dto/create-attachment.dto.ts`: Polymorphic attachment schema DTO.
- `packages/entries/src/presentation/dto/update-entry.dto.ts`: DTO for entry updates.
- `packages/entries/src/presentation/dto/index.ts`: Barrel export for DTOs.
- `packages/entries/src/presentation/controllers/entries.controller.ts`: NestJS HTTP controller for `/entries`.
- `packages/entries/src/presentation/controllers/search.controller.ts`: NestJS HTTP controller for `/entries/search`.
- `packages/entries/src/presentation/controllers/index.ts`: Barrel export for controllers.
- `packages/entries/src/presentation/index.ts`: Barrel export for presentation.
- `packages/entries/src/entries.module.ts`: NestJS module declaration wiring controller and providers.
- `packages/entries/src/index.ts`: Public package API entry point.

### 2.2 Data Models, Interfaces, and Contracts
- Abstract interfaces:
  - `EntryRepository`: `{ save, findById, findByDate, listByUser, listRecent, update, delete, deleteAll }`
  - `PendingAttachmentRepository`: `{ create, delete, deleteMany, findOrphansBefore, deleteByUrlsOrPaths, findById }`
  - `VectorSearchProvider`: `{ indexEntry, removeEntry, removeAll, semanticSearch }`
- Domain exceptions imported from `@journ/common`:
  - `ValidationError`, `NotFoundError`, `ConflictError`
- External infrastructure interfaces imported from `@journ/common`:
  - `AIProvider`, `StorageProvider`

### 2.3 Dependencies
- `@journ/common`: Workspace package dependency for domain error classes and infrastructure contracts.
- Root hoisted dependencies: `@nestjs/common`, `@nestjs/core`, `firebase-admin`, `@google-cloud/aiplatform`, `class-validator`, `class-transformer`, `reflect-metadata`.
- Zero new external packages will be added.

### 2.4 Risks & Trade-offs
- **Risk:** Path scoping boundary violation TS6059 in `packages/entries/tsconfig.json`.
  - **Mitigation:** Rely on workspace package resolution (`packages/common/dist/`) via node_modules rather than cross-package relative path aliases.
- **Risk:** Unhandled promise rejections in asynchronous vector indexing during entry create/edit.
  - **Mitigation:** Wrap async indexing in `.catch(...)` logging within `EntryService`, fulfilling the contract tested in `entry.service.spec.ts`.

### 2.5 Test Strategy
| Requirement | Covered By Test Suite |
| :--- | :--- |
| `REQ-1` (Domain & Interfaces) | `packages/entries/test/services/entry.service.spec.ts`<br>`packages/entries/test/services/semantic-search.service.spec.ts` |
| `REQ-2` (Domain Services) | `packages/entries/test/services/entry.service.spec.ts`<br>`packages/entries/test/services/semantic-search.service.spec.ts`<br>`packages/entries/test/services/attachment-cleanup-cron.service.spec.ts` |
| `REQ-3` (Infrastructure Adapters) | `packages/entries/test/infrastructure/repositories/firestore-entry.repository.spec.ts`<br>`packages/entries/test/infrastructure/repositories/firestore-pending-attachment.repository.spec.ts`<br>`packages/entries/test/infrastructure/providers/firestore-cosine-vector-search.provider.spec.ts`<br>`packages/entries/test/infrastructure/providers/vertex-vector-search.provider.spec.ts` |
| `REQ-4` (Presentation & DTOs) | `packages/entries/test/presentation/controllers/entries.controller.spec.ts`<br>`packages/entries/test/presentation/controllers/search.controller.spec.ts`<br>`packages/entries/test/presentation/dto/create-entry.dto.spec.ts`<br>`packages/entries/test/presentation/dto/update-entry.dto.spec.ts` |
| `REQ-5` (Module Wiring) | `packages/entries/test/entries.module.spec.ts` |
| `REQ-6` (Independent Build & Test) | `npm run build -w @journ/entries` & `npm test -w @journ/entries` |
| `REQ-7` (Monolith Non-Interference) | Monolith `npm test` passing 32/32 suites (172 tests) |

---

## 3. Tasks

- [x] **Task 1: Implement Domain Models & Contract Interfaces (`REQ-1`)**
  - Create `packages/entries/src/domain/` (`entry.ts`, `attachment.ts`, `pending-attachment.entity.ts`, `entry-summary.ts`, `semantic-search-result.ts`, `vector-search-result.ts`, `index.ts`).
  - Create `packages/entries/src/interfaces/` (`entry-repository.interface.ts`, `pending-attachment-repository.interface.ts`, `vector-search-provider.interface.ts`, `index.ts`).
  - *Done when:* All domain entities and contract interfaces exist and export cleanly with zero external peer package imports.

- [x] **Task 2: Implement Domain Services (`REQ-2`)**
  - Create `packages/entries/src/services/entry.service.ts` with validation, CRUD, autosave conflict detection, timeline formatting, and resilient async indexing.
  - Create `packages/entries/src/services/semantic-search.service.ts` with query embedding, score mapping, and chip extraction.
  - Create `packages/entries/src/services/attachment-cleanup-cron.service.ts` with resilient orphan garbage collection.
  - Create `packages/entries/src/services/index.ts`.
  - *Done when:* `npm test -w @journ/entries packages/entries/test/services` passes all 3 suites green.

- [x] **Task 3: Implement Cloud Infrastructure Adapters (`REQ-3`)**
  - Create `packages/entries/src/infrastructure/repositories/firestore-entry.repository.ts`.
  - Create `packages/entries/src/infrastructure/repositories/firestore-pending-attachment.repository.ts`.
  - Create `packages/entries/src/infrastructure/providers/firestore-cosine-vector-search.provider.ts`.
  - Create `packages/entries/src/infrastructure/providers/vertex-vector-search.provider.ts`.
  - Create barrel exports in `infrastructure/repositories/index.ts`, `infrastructure/providers/index.ts`, and `infrastructure/index.ts`.
  - *Done when:* `npm test -w @journ/entries packages/entries/test/infrastructure` passes all 4 suites green.

- [x] **Task 4: Implement Presentation Controllers & DTOs (`REQ-4`)**
  - Create `packages/entries/src/presentation/dto/` (`create-entry.dto.ts`, `create-attachment.dto.ts`, `update-entry.dto.ts`, `index.ts`).
  - Create `packages/entries/src/presentation/controllers/entries.controller.ts` with optional signed URL resolution.
  - Create `packages/entries/src/presentation/controllers/search.controller.ts`.
  - Create barrel exports in `presentation/controllers/index.ts` and `presentation/index.ts`.
  - *Done when:* `npm test -w @journ/entries packages/entries/test/presentation` passes all 4 suites green.

- [x] **Task 5: Wire NestJS Module and Public Package Entry Point (`REQ-5`)**
  - Create `packages/entries/src/entries.module.ts` registering controllers, providers, factory services, and exports.
  - Create `packages/entries/src/index.ts` exporting public package symbols.
  - *Done when:* `npm test -w @journ/entries packages/entries/test/entries.module.spec.ts` passes 1/1 integration test green.

- [x] **Task 6: Validate Independent Package Build and Full Test Suite Execution (`REQ-6`)**
  - Run `npm run build -w @journ/entries`.
  - Run `npm test -w @journ/entries`.
  - *Done when:* TypeScript compiles cleanly with 0 errors to `packages/entries/dist/` and all 12 staged test suites (85 tests) pass 100% green.

- [x] **Task 7: Verify Monolith Non-Interference (`REQ-7`)**
  - Run `git status -s` to verify zero modified files in `src/` or `frontend/`.
  - Run `npm test` across root workspace.
  - *Done when:* Root test runner executes all 32 legacy suites (172 tests) with 100% pass rate.
