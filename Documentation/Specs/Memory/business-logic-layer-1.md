# Business Logic Layer — Task 1

**Date:** 2026-09-02  
**Scope:** Low-level business logic — domain models, repository/provider interfaces, service layer, unit tests  
**Status:** Complete — 49/49 tests passing, feature-based modular structure

---

## What Was Built

The codebase is organized by **feature slices** (`entries`, `chat`, `habit-memory`), plus a shared `common` module for cross-cutting interfaces like `AIProvider`. Each feature houses its own domain models, interfaces, services, and unit tests.

### 1. Entries Feature (`src/entries/`)

Handles all core journaling functionality: creating, updating, and viewing entries.

| Path | Element | Purpose |
|------|---------|---------|
| `domain/attachment.ts` | `Attachment`, `AttachmentType` | Value object for attachments (voice, photo, location) |
| `domain/entry.ts` | `Entry` | Core journal entry entity (one per calendar day per user) |
| `domain/entry-summary.ts` | `EntrySummary` | Display model for timeline view with AI gist |
| `domain/index.ts` | Barrel | Re-exports entry domain types |
| `interfaces/entry-repository.interface.ts` | `EntryRepository` | Contract for entry persistence operations |
| `interfaces/vector-search-provider.interface.ts` | `VectorSearchProvider` | Contract for embedding and vector indexing |
| `interfaces/index.ts` | Barrel | Re-exports entry interfaces |
| `services/entry.service.ts` | `EntryService` | Core business logic (one-per-day rule, async indexing, timeline) |
| `__tests__/entry.service.spec.ts` | Unit Tests | 18 tests covering all EntryService methods & edge cases |
| `index.ts` | Barrel | Feature root barrel export |

### 2. Chat Feature (`src/chat/`)

Handles conversational companion interactions, message routing, and consent-based journal drafting.

| Path | Element | Purpose |
|------|---------|---------|
| `domain/chat-message-mode.ts` | `ChatMessageMode` | `'text' \| 'voice'` mode selector |
| `domain/chat-response.ts` | `ChatResponse` | AI reply envelope with optional draft |
| `domain/chat-session.ts` | `ChatSession` | Session state containing habit memory snapshot |
| `domain/draft-save-target.ts` | `DraftSaveTarget` | `'new' \| 'today'` save destination target |
| `domain/entry-draft.ts` | `EntryDraft` | Extracted journal draft pending user confirmation |
| `domain/index.ts` | Barrel | Re-exports chat domain types |
| `services/chat.service.ts` | `ChatService` | Session management, chat routing, draft extraction & save |
| `__tests__/chat.service.spec.ts` | Unit Tests | 21 tests covering chat session, messaging, and draft workflows |
| `index.ts` | Barrel | Feature root barrel export |

### 3. Habit Memory Feature (`src/habit-memory/`)

Handles the AI-derived habit profile calibration, calculated from recent entries.

| Path | Element | Purpose |
|------|---------|---------|
| `domain/habit-memory.ts` | `HabitMemory` | User habit profile entity (topics, frequency, tone) |
| `domain/index.ts` | Barrel | Re-exports habit memory domain types |
| `interfaces/habit-memory-store.interface.ts` | `HabitMemoryStore` | Contract for single-doc habit memory persistence |
| `interfaces/index.ts` | Barrel | Re-exports habit memory interfaces |
| `services/habit-memory.service.ts` | `HabitMemoryService` | 30-day recent entry analysis & habit derivation logic |
| `__tests__/habit-memory.service.spec.ts` | Unit Tests | 10 tests covering derivations, fallbacks, and storage |
| `index.ts` | Barrel | Feature root barrel export |

### 4. Cross-Cutting Common (`src/common/`)

| Path | Element | Purpose |
|------|---------|---------|
| `interfaces/ai-provider.interface.ts` | `AIProvider` | Unified interface for AI capabilities across features |
| `interfaces/index.ts` | Barrel | Re-exports common interfaces |
| `index.ts` | Barrel | Module root barrel export |

---

## Unit Test Summary

| Feature | Test Suite | Tests | Result |
|---------|------------|-------|--------|
| Entries | `src/entries/__tests__/entry.service.spec.ts` | 18 | Passed |
| Chat | `src/chat/__tests__/chat.service.spec.ts` | 21 | Passed |
| Habit Memory | `src/habit-memory/__tests__/habit-memory.service.spec.ts` | 10 | Passed |
| **Total** | | **49** | **All Passing** |

---

## Design Decisions Made

1. **Feature-based architecture** — Groups domain models, contracts, and services by business bounded context (`entries`, `chat`, `habit-memory`), making it easier to navigate, maintain, and package into NestJS modules later.
2. **Domain models as interfaces, not classes** — Data shapes without framework annotations. Logic lives in pure services.
3. **Fire-and-forget vector indexing** — `EntryService` executes `vectorSearch.indexEntry()` in a non-blocking background promise so user-facing writes remain fast and resilient.
4. **Consent-based chat journaling** — Drafts extracted from conversations require explicit confirmation via `confirmDraftSave` before persisting.
5. **Fallbacks for habit memory** — Sensible defaults (`frequency: 'unknown'/'none'`, `tone: 'neutral'`) protect cold-start flows for new users.

---

## What's NOT in This Layer

- No NestJS decorators (`@Injectable`, `@Controller`, etc.)
- No concrete database code (Firestore, etc.)
- No HTTP controllers or request/response handling
- No external AI API clients (Gemini, ADK)
- No frontend code
- No integration tests

---

## File Tree

```
src/
  chat/
    domain/
      chat-message-mode.ts
      chat-response.ts
      chat-session.ts
      draft-save-target.ts
      entry-draft.ts
      index.ts
    services/
      chat.service.ts
    __tests__/
      chat.service.spec.ts
    index.ts
  common/
    interfaces/
      ai-provider.interface.ts
      index.ts
    index.ts
  entries/
    domain/
      attachment.ts
      entry-summary.ts
      entry.ts
      index.ts
    interfaces/
      entry-repository.interface.ts
      vector-search-provider.interface.ts
      index.ts
    services/
      entry.service.ts
    __tests__/
      entry.service.spec.ts
    index.ts
  habit-memory/
    domain/
      habit-memory.ts
      index.ts
    interfaces/
      habit-memory-store.interface.ts
      index.ts
    services/
      habit-memory.service.ts
    __tests__/
      habit-memory.service.spec.ts
    index.ts
  index.ts
```

---

## Next Steps

1. **NestJS module wiring** — Wrap services with `@Injectable()`, declare providers in respective feature modules (`EntriesModule`, `ChatModule`, `HabitMemoryModule`).
2. **Concrete repositories** — `FirestoreEntryRepository`, `FirestoreHabitMemoryStore`.
3. **Concrete AI providers** — `GeminiAIProvider` with ADK agent integration behind `AIProvider`.
4. **Controllers & DTOs** — HTTP presentation endpoints.
5. **Integration tests** — Firebase Emulator-backed tests for Controller -> Service -> Repository flows.
