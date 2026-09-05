# Business Logic Layer — Task 4

**Date:** 2026-09-05
**Scope:** Integration Data Processing & Cascading Deletion
**Status:** Complete

---

## What Was Built

Implemented the requested business logic to support semantic search, cascading account deletion, and concurrent autosaves, strictly maintaining the Domain-Driven Design constraints.

### 1. Semantic Search Extractor Service
- **Domain Models Added:** Created `VectorSearchResult` and `SemanticSearchResult` to type the transitions between raw vector distances and formatted UI shapes.
- **Provider Interface Updates:** 
  - Updated `VectorSearchProvider.semanticSearch` to return `VectorSearchResult` instead of just an `Entry` array, surfacing the raw distance.
  - Added `extractSemanticChips` to `AIProvider` to utilize NLP for extracting 2-3 key phrases based on the user's query and matched document.
- **SemanticSearchService:** Created `src/entries/services/semantic-search.service.ts` to orchestrate this flow. It fetches vector results, maps the raw vector distance into a human-readable `matchScore` percentage (e.g. 0 to 100), and requests the semantic chips concurrently, returning a sorted array of enriched results.

### 2. Cascading Account Deletion Service
- **Domain/Interfaces Added:** Created `src/account/interfaces` establishing the contracts for `AccountRepository` (to delete the user doc) and `AuthProvider` (to delete tokens/identity). Added `deleteAll` to `EntryRepository` and `removeAll` to `VectorSearchProvider`.
- **AccountService:** Created `src/account/services/account.service.ts`. Implemented `wipeUserData(uid)` which executes the stringent deletion sequence required by the architecture:
  1. Cascade deletes all entries (`EntryRepository.deleteAll(uid)`).
  2. Purges the vector search embeddings (`VectorSearchProvider.removeAll(uid)`).
  3. Deletes the core user document (`AccountRepository.deleteUserDocument(uid)`).
  4. Revokes authentication (`AuthProvider.deleteAccount(uid)`).

### 3. Autosave Concurrency Service
- **Domain Model Updates:** Added `lastAutosaveAt?: Date` to the `Entry` domain model to track client-provided timestamps.
- **EntryService Updates:** Implemented `autosave(uid, entryId, text, clientTimestamp)` in `EntryService`. This utilizes a simple timestamp-based "last-write-wins" optimistic concurrency check. If an entry's stored `lastAutosaveAt` timestamp is newer than the incoming request's timestamp, the service safely rejects the write with a `ConflictError`, preventing out-of-order debounced saves from overwriting newer data.

### 4. Unit Tests
- Wrote and updated Jest spec files for the new services and methods (`semantic-search.service.spec.ts`, `account.service.spec.ts`, and `entry.service.spec.ts`).
- All tests pass, validating that business rules execute flawlessly in isolation from concrete infrastructure.
