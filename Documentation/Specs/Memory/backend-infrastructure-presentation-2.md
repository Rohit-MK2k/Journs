# Backend Infrastructure & Presentation — Task 2

**Date:** 2026-09-03  
**Scope:** NestJS configuration, controllers, DTOs, Auth Guard, concrete persistence (Firestore), concrete AI providers (dummy Gemini/Vertex), Cron job, and Integration wiring via Modules  
**Status:** Complete — All tests passing, DIP upheld via `@nestjs/common` module wiring

---

## What Was Built

The codebase was extended with a NestJS backend application setup, bridging the pure business logic developed in Task 1 with external HTTP clients and databases, completely upholding the Dependency Inversion Principle (DIP).

### 1. Presentation Layer (Controllers & DTOs)

| Path | Element | Purpose |
|------|---------|---------|
| `src/entries/presentation/dto/*` | `CreateEntryDto`, `UpdateEntryDto` | Validated payloads for entry creation and editing using `class-validator`. |
| `src/chat/presentation/dto/*` | `SendMessageDto`, `ConfirmDraftDto` | Validated payloads for chat operations. |
| `src/entries/presentation/controllers/entries.controller.ts` | `EntriesController` | REST endpoints for POST `/entries` and GET `/entries/timeline`. |
| `src/chat/presentation/controllers/chat.controller.ts` | `ChatController` | REST endpoints for POST `/chat/session`, `/chat/message`, and `/chat/draft/confirm`. |

### 2. Infrastructure Layer (Auth, DB, & Providers)

| Path | Element | Purpose |
|------|---------|---------|
| `src/common/guards/firebase-auth.guard.ts` | `FirebaseAuthGuard` | Extracts Bearer token, verifies via `firebase-admin/auth`, injects `req.user.uid`. |
| `src/entries/infrastructure/repositories/firestore-entry.repository.ts` | `FirestoreEntryRepository` | Concrete implementation mapping `EntryRepository` to `users/{uid}/entries` subcollections in Firestore. |
| `src/habit-memory/infrastructure/repositories/firestore-habit-memory.store.ts` | `FirestoreHabitMemoryStore` | Concrete implementation mapping `HabitMemoryStore` to `users/{uid}/habitMemory/default`. |
| `src/common/infrastructure/providers/gemini-ai.provider.ts` | `GeminiAIProvider` | Skeleton implementation mapping `AIProvider` for Gemini SDK calls. |
| `src/entries/infrastructure/providers/vertex-vector-search.provider.ts` | `VertexAIVectorSearchProvider` | Skeleton implementation mapping `VectorSearchProvider` for RAG. |

### 3. Background Jobs

| Path | Element | Purpose |
|------|---------|---------|
| `src/habit-memory/infrastructure/jobs/habit-memory.cron.ts` | `HabitMemoryCronService` | `@Cron('0 2 * * *')` job that lists users and calls `HabitMemoryService.refreshMemory()` post-2am. |

### 4. Integration Wiring (Modules)

To adhere to the Dependency Inversion Principle and maintain the purity of the service layer (which contains no `@Injectable()` decorators), custom providers were used with `useFactory`.

| Path | Element | Purpose |
|------|---------|---------|
| `src/entries/entries.module.ts` | `EntriesModule` | Provides `FirestoreEntryRepository` and uses a factory to construct `EntryService`. |
| `src/chat/chat.module.ts` | `ChatModule` | Wires dependencies into `ChatService`. |
| `src/habit-memory/habit-memory.module.ts` | `HabitMemoryModule` | Sets up cron job and factory provider for `HabitMemoryService`. |
| `src/common/common.module.ts` | `CommonModule` | Globably exposes concrete `AIProvider` and `VectorSearchProvider`. |
| `src/app.module.ts` | `AppModule` | Root module importing all feature modules. |
| `src/__tests__/app.module.spec.ts` | Integration Test | Verifies NestJS can resolve the entire dependency graph successfully. |

---

## Technical Decisions

1. **Test-Driven Infrastructure**: Mocked `firebase-admin/auth` and `firebase-admin/firestore` at the module level in unit tests for deterministic testing.
2. **NestJS v10**: Initialized NestJS using CommonJS structure (v10 vs v11) to maintain out-of-the-box compatibility with `ts-jest` for `node_modules` dependencies (e.g. `jose`).
3. **Pure Services (DIP)**: Used `useFactory` to instantiate services inside modules. The services still have zero knowledge of HTTP, Controllers, NestJS decorators, or Firebase dependencies.
4. **Out-of-Scope Bug Delegation**: Identified a type mis-match with `EntryService.createEntry` (Task 1 logic mistake). Used `as any` casting in the controller as a temporary bridge and generated `Documentation/Specs/business-logic-layer-2.md` for another agent to safely adjust the underlying signature without scope creep.

---

## Next Steps

1. **Authentication API Alignment**: Frontend implementation of Google Login to acquire the ID tokens that `FirebaseAuthGuard` requires.
2. **Actual Implementations**: Flesh out `GeminiAIProvider` with real Google Agent Development Kit (ADK) logic.
3. **Frontend Implementation**: Initialize the Next.js UI using zero-friction principles (Task 3).
