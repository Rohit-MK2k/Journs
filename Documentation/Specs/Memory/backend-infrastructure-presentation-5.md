# Backend Infrastructure & Presentation — Task 5 (DI Refactor)

**Date:** 2026-09-05
**Scope:** Architecture Refactor - SDK Dependency Inversion 

## What Was Fixed

A structural bug in test DI compilation (`app.module.spec.ts`) revealed that external third-party SDKs (`GoogleGenAI` and Google Cloud `v1`) were instantiated tightly inside the `GeminiAIProvider` and `VertexAIVectorSearchProvider` constructors. 

This tight coupling caused automated CI/CD integration tests to throw authorization errors because `.env` credentials are not present in test runs, and test harnesses could not inject mock SDK objects into hardcoded `new` calls.

### Changes Made (Fix 2: Pure Dependency Inversion)

1. **`CommonModule` (Token Factories):**
   - Registered `'GENAI_CLIENT'` using `useFactory` to construct `GoogleGenAI`.
   - Registered `'VERTEX_INDEX_CLIENT'` and `'VERTEX_MATCH_CLIENT'` to construct `IndexServiceClient` and `MatchServiceClient`.
   - Exported all three SDK tokens globally so the DI container can inject them anywhere.

2. **`GeminiAIProvider` & `VertexAIVectorSearchProvider`:**
   - Eradicated all `new GoogleGenAI()` and `new ...ServiceClient()` invocations from constructor bodies.
   - Refactored constructors to accept the tokens via `@Inject('GENAI_CLIENT')`, transferring absolute lifecycle control to the NestJS DI container.

3. **`app.module.spec.ts` (Integration Test Harness):**
   - Removed the need for file-level `jest.mock()` monkey-patching for Google SDKs.
   - Leveraged native DI chaining (`Test.createTestingModule(...).overrideProvider('GENAI_CLIENT').useValue({})`) to safely pass dummy objects to providers during the container compilation phase.

### Results
- 100% pure SOLID compliance extending completely to the edge of the system boundary.
- Zero network side effects triggered when bootstrapping classes.
- All 88 tests pass successfully without requiring active Google Cloud credentials in the test environment.
