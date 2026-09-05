# Backend Infrastructure & Presentation Task 6: API Gateway & Controller Contracts

**Date:** 2026-09-05
**Scope:** Align API controllers and endpoints with frontend integration contracts (Task 6).

## What Was Done

All backend NestJS controllers and domain abstractions were updated to strictly conform with the API contract specifications necessary for the frontend implementation.

### 1. `EntriesController` (`/entries`)
- **`GET /`**: Renamed from `/timeline`. Updated `EntryService` to inject `wordCount` and `hasAttachments` directly into the `EntrySummary` timeline response payload. Now wrapped in `{ data: [], meta: { total: n } }` structure.
- **`POST /autosave`**: Created new endpoint mapping to a new `autosaveEntry` business logic method. Supports rapid UI debouncing by seamlessly upserting (create or update) the "Today" journal entry.

### 2. `ChatController` (`/chat`)
- **`POST /message`**: Refactored response payload handling to support Server-Sent Events (SSE) directly over POST by manually constructing chunked streams (`res.write()`) and setting `text/event-stream` headers, keeping it compatible with browser-based generic Fetch readers.
- **`POST /voice`**: Implemented initial stub endpoint ready for downstream voice transcribing algorithms.

### 3. `SearchController` (`/search`)
- Created a new controller to handle direct RAG and vector queries.
- **`GET /`**: Invokes vector search pipeline. Re-mapped semantic results into a composite frontend payload containing explicit `matchScore` calculations and AI-extracted `semanticChips` attached to each retrieved entry shell.
- Upgraded the `VertexAIVectorSearchProvider` base interface to output `VectorSearchResult[]` with distances, replacing the raw `Entry[]` payload.

### 4. `AccountController` (`/account`)
- Bootstrapped brand new `AccountModule` and controller.
- **`PATCH /settings`**: Stubbed endpoint to handle habit memory feature toggles.
- **`DELETE /`**: Stubbed endpoint to handle GDPR-compliant account deletion (which relies on newly exposed repository abstractions).

### 5. Backend Type/Interface Upgrades
- Added `deleteAll(uid)` to the `EntryRepository` contract and fully implemented the batch deletion logic in `FirestoreEntryRepository`.
- Added `removeAll(uid)` to the Vector Search provider.
- Added `extractSemanticChips(query, text)` to `AIProvider` and concretely implemented it in `GeminiAIProvider` utilizing the `gemini-1.5-flash` model.

**Result:** All 100 test suites compiled and passed against the new unified frontend-API contract without breaking existing RAG and persistence integrations.
