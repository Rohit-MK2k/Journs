# Parallel Monorepo Migration — Phase 1 (Part 1): `@journ/common` Test Suite Specification

**Date:** 2026-10-15  
**Scope:** Test runner configuration, test case specifications, and commenting standards for all `@journ/common` units and `CommonModule` (Part 1 of Phase 1)  
**Target:** `packages/common/test/`, `packages/common/jest.config.js`  
**Parent Plan:** [parallel-monorepo-migration-plan.md](./parallel-monorepo-migration-plan.md)  
**Status:** Approved for Test Suite Staging  

---

## 1. Scope & Isolation Principles

This specification is Part 1 of Phase 1 and defines **only** the test infrastructure, runner configuration, and detailed test cases for `@journ/common`. Production class implementation is deliberately deferred to Part 2.

### 1.1 Non-Interference Guardrails
1. **Root Isolation:** Root `jest.config.js` specifies `roots: ['<rootDir>/src']`. It will not traverse into `packages/common/test/`.
2. **Dedicated Test Runner:** `packages/common` operates its own test configuration:
   ```bash
   npm test --workspace=@journ/common
   ```
3. **Zero Monolith Breakage:** Tests and source in `src/common/` remain untouched and functional.

### 1.2 Boundary Contracts (No Peer Module Leaks)
Legacy provider tests (`src/common/infrastructure/providers/__tests__/gemini-ai.provider.spec.ts`) leaked dependencies into peer domains (`chat/domain`, `habit-memory/domain`, `entries/domain`).

In `@journ/common`, tests must only import from within `@journ/common`. All cross-domain entities consumed by providers must use abstract contract interfaces defined in `packages/common/src/interfaces/`:
- `IChatSession`
- `IHabitMemory`
- `IEntry`
- `IChatTurnResponse`

---

## 2. Test Runner Configuration (`packages/common/jest.config.js`)

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@journ/common/(.*)$': '<rootDir>/src/$1',
    '^@journ/common$': '<rootDir>/src/index'
  },
  transformIgnorePatterns: [
    'node_modules/(?!@nestjs|@firebase|firebase-admin|jose|jwks-rsa)'
  ]
};
```

---

## 3. Test Suites Directory Layout

```text
packages/common/test/
├── common.module.spec.ts                     # CommonModule DI compilation & export resolution [Integration Test]
├── guards/
│   └── firebase-auth.guard.spec.ts           # Token extraction, validation & rejection [Unit Test]
├── infrastructure/
│   ├── firebase/
│   │   └── firebase.config.spec.ts           # Admin SDK initialization & credentials fallback [Unit Test]
│   └── providers/
│       ├── firebase-storage.provider.spec.ts # Upload URL, signed read URL & deletion [Unit Test]
│       └── gemini-ai.provider.spec.ts        # Summarization, chat, habit derive & code skipping [Unit Test]
├── presentation/
│   ├── controllers/
│   │   └── health.controller.spec.ts         # GET / and GET /health probes [Unit Test]
│   └── filters/
│       └── domain-exception.filter.spec.ts   # Domain error to HTTP status code mappings [Unit Test]
└── utils/
    └── summarization.util.spec.ts            # Word count, code detection & summarize criteria [Unit Test]
```

---

## 4. Detailed Test Case Specifications

### 4.1 `test/common.module.spec.ts` (Common Module Integration)
- **Classification:** `[Integration Test]`
- **Target Unit:** `CommonModule` (`src/common.module.ts`)
- **Collaborators / Mocks:**
  - `@nestjs/testing` (`Test.createTestingModule`)
- **Test Cases:**
  1. `[Integration Test] should compile CommonModule and resolve controllers and providers`
     - **Setup:** Create testing module importing `CommonModule`.
     - **Assertion:** 
       - Module compiles without error.
       - `HealthController` resolves.
       - `AIProvider` resolves to instance of `GeminiAIProvider`.
       - `StorageProvider` resolves to instance of `FirebaseStorageProvider`.
       - Injection tokens `GENAI_CLIENT`, `VERTEX_INDEX_CLIENT`, and `VERTEX_MATCH_CLIENT` resolve.

---

### 4.2 `test/guards/firebase-auth.guard.spec.ts`
- **Classification:** `[Unit Test]`
- **Target Unit:** `FirebaseAuthGuard` (`src/guards/firebase-auth.guard.ts`)
- **Collaborators / Mocks:**
  - `firebase-admin/auth` (`getAuth().verifyIdToken`)
  - NestJS `ExecutionContext`
- **Test Cases:**
  1. `[Unit Test] should allow access if token is valid`
     - **Setup:** HTTP request with `authorization: Bearer <valid-token>`.
     - **Mock:** `verifyIdToken` resolves with `{ uid: 'user123' }`.
     - **Assertion:** Returns `true`; sets `request.user = { uid: 'user123' }`.
  2. `[Unit Test] should throw UnauthorizedException if no auth header`
     - **Setup:** HTTP request without `authorization` header.
     - **Assertion:** Rejects with `UnauthorizedException`.
  3. `[Unit Test] should throw UnauthorizedException if token is invalid`
     - **Setup:** HTTP request with `authorization: Bearer invalid`.
     - **Mock:** `verifyIdToken` rejects with `Error('Invalid token')`.
     - **Assertion:** Rejects with `UnauthorizedException`.

---

### 4.3 `test/infrastructure/firebase/firebase.config.spec.ts`
- **Classification:** `[Unit Test]`
- **Target Unit:** `initializeFirebaseAdmin()` (`src/infrastructure/firebase/firebase.config.ts`)
- **Collaborators / Mocks:**
  - `firebase-admin/app` (`initializeApp`, `getApps`, `cert`)
  - `fs` (`existsSync`, `readFileSync`)
- **Test Cases:**
  1. `[Unit Test] should not initialize if already initialized`
     - **Setup:** `getApps()` returns `[{ name: 'default' }]`.
     - **Assertion:** `initializeApp` is not called.
  2. `[Unit Test] should initialize with cert when credentials file exists`
     - **Setup:** `getApps()` returns `[]`, `fs.existsSync` returns `true`, `fs.readFileSync` returns JSON with `project_id: 'test-proj'`.
     - **Assertion:** `initializeApp` is called with object containing `projectId: 'test-proj'` and cert credential.
  3. `[Unit Test] should initialize with default credentials when file does not exist`
     - **Setup:** `getApps()` returns `[]`, `fs.existsSync` returns `false`, `process.env.GCP_PROJECT_ID = 'test-gcp'`.
     - **Assertion:** `initializeApp` is called with `{ projectId: 'test-gcp' }`.

---

### 4.4 `test/infrastructure/providers/firebase-storage.provider.spec.ts`
- **Classification:** `[Unit Test]`
- **Target Unit:** `FirebaseStorageProvider` (`src/infrastructure/providers/firebase-storage.provider.ts`)
- **Collaborators / Mocks:**
  - `firebase-admin/storage` (`getStorage().bucket().file()`)
- **Test Cases:**
  1. `[Unit Test] should generate upload url`
     - **Input:** `userId: 'u1'`, `contentType: 'image/jpeg'`, `extension: 'jpg'`.
     - **Mock:** `file.getSignedUrl` resolves `['http://mock-signed-url.com']`.
     - **Assertion:** Returns object with `uploadUrl`, `publicUrl`, `filePath` matching `/^users\/u1\/attachments\/[a-f0-9-]+\.jpg$/`, and defined `fileId`.
  2. `[Unit Test] should generate signed read url`
     - **Input:** `filePath: 'users/u1/attachments/file.jpg'`.
     - **Assertion:** Returns signed URL string.
  3. `[Unit Test] should delete existing file`
     - **Input:** `filePath: 'users/u1/attachments/file.jpg'`.
     - **Mock:** `file.exists()` resolves `[true]`.
     - **Assertion:** `file.delete()` is invoked.
  4. `[Unit Test] should skip delete if file does not exist`
     - **Input:** `filePath: 'users/u1/attachments/notfound.jpg'`.
     - **Mock:** `file.exists()` resolves `[false]`.
     - **Assertion:** `file.delete()` is not invoked.

---

### 4.5 `test/infrastructure/providers/gemini-ai.provider.spec.ts`
- **Classification:** `[Unit Test]`
- **Target Unit:** `GeminiAIProvider` (`src/infrastructure/providers/gemini-ai.provider.ts`)
- **Collaborators / Mocks:**
  - `@google/genai` client (`models.generateContent`)
  - Contracts: `IChatSession`, `IHabitMemory`, `IEntry` (from `@journ/common/interfaces`)
- **Test Cases:**
  1. `[Unit Test] should summarize text with >20 words`
     - **Input:** Natural text > 20 words.
     - **Mock:** `generateContent` resolves `{ text: 'summary' }`.
     - **Assertion:** Returns `'summary'`; `generateContent` is invoked.
  2. `[Unit Test] should skip summarization when text has 20 or fewer words`
     - **Input:** Natural text <= 20 words.
     - **Assertion:** Returns `''`; `generateContent` is not invoked.
  3. `[Unit Test] should generate chat response`
     - **Input:** Session adhering to `IChatSession`, user message `'hi'`.
     - **Mock:** `generateContent` resolves `{ text: 'hello' }`.
     - **Assertion:** Returns `{ message: 'hello' }`.
  4. `[Unit Test] should extract context`
     - **Input:** Text snippet.
     - **Mock:** `generateContent` resolves `{ text: 'extracted' }`.
     - **Assertion:** Returns `{ text: 'extracted' }`.
  5. `[Unit Test] should derive habit memory with writing habits`
     - **Input:** Array of entries adhering to `IEntry`.
     - **Mock:** `generateContent` resolves JSON payload with `topics`, `frequency`, `tone`, and `writingHabits` (structure, depth, timing, vocabulary).
     - **Assertion:** Returns parsed `IHabitMemory` object matching schema.
  6. `[Unit Test] should generate summary for valid text and skip code`
     - **Input 1:** Valid prose > 20 words -> generates summary.
     - **Input 2:** Markdown code block (````typescript ... ````) -> returns `''` without calling SDK.
  7. `[Unit Test] should process chat turn`
     - **Input:** Message history, current message, retrieved entries.
     - **Mock:** `generateContent` resolves JSON `{ replyText: 'Hi', extractedDraft: 'draft text' }`.
     - **Assertion:** Returns `{ replyText: 'Hi', extractedDraft: 'draft text' }`.

---

### 4.6 `test/presentation/controllers/health.controller.spec.ts`
- **Classification:** `[Unit Test]`
- **Target Unit:** `HealthController` (`src/presentation/controllers/health.controller.ts`)
- **Test Cases:**
  1. `[Unit Test] should return ok status on /health`
     - **Assertion:** Returns `{ status: 'ok', service: 'journ-backend', timestamp: expect.any(String) }`.
  2. `[Unit Test] should return running status on /`
     - **Assertion:** Returns `{ status: 'running', name: 'Journ API', timestamp: expect.any(String) }`.

---

### 4.7 `test/presentation/filters/domain-exception.filter.spec.ts`
- **Classification:** `[Unit Test]`
- **Target Unit:** `DomainExceptionFilter` (`src/presentation/filters/domain-exception.filter.ts`)
- **Collaborators / Mocks:**
  - NestJS `ArgumentsHost`
  - Domain exceptions: `ValidationError`, `NotFoundError`, `ConflictError`, `DomainError`
- **Test Cases:**
  1. `[Unit Test] should be defined`
  2. `[Unit Test] should map ValidationError to 400`
     - **Assertion:** Status 400, body contains `{ statusCode: 400, message: 'Invalid input' }`.
  3. `[Unit Test] should map NotFoundError to 404`
     - **Assertion:** Status 404, body contains `{ statusCode: 404, message: 'Entry not found' }`.
  4. `[Unit Test] should map ConflictError to 409`
     - **Assertion:** Status 409, body contains `{ statusCode: 409, message: 'Entry already exists' }`.
  5. `[Unit Test] should map generic DomainError to 500`
     - **Assertion:** Status 500, body contains `{ statusCode: 500, message: 'Internal server error' }`.

---

### 4.8 `test/utils/summarization.util.spec.ts`
- **Classification:** `[Unit Test]`
- **Target Unit:** `countWords`, `isProgrammingCode`, `shouldSummarize` (`src/utils/summarization.util.ts`)
- **Test Cases:**
  1. `[Unit Test] countWords`
     - Empty string -> 0
     - Whitespace string -> 0
     - Two words -> 2
     - Ten words -> 10
  2. `[Unit Test] isProgrammingCode`
     - Detects markdown code fences (````typescript ... ````) -> `true`
     - Detects typical programming constructs (`import React`, `function ...`, `public class ...`, `def ...`) -> `true`
     - Returns `false` for natural English prose
  3. `[Unit Test] shouldSummarize`
     - Returns `false` when word count <= 20
     - Returns `false` for programming code even if long
     - Returns `true` for natural prose with > 20 words

---

## 5. Test Code Commenting & Classification Standard

Every test case implementation across `packages/common/test/` must include structured inline comments defining its classification and purpose.

### 5.1 Classification Definitions
- **`Unit Test`**: Tests an individual class, function, or method in total isolation with all collaborators mocked (e.g., individual guards, utilities, controllers, providers).
- **`Integration Test`**: Tests the interaction or configuration across multiple components or containers (e.g., `CommonModule` compiling its DI container and resolving provider tokens).

### 5.2 Mandatory Comment Syntax

Each `it(...)` or `test(...)` block must be preceded by a JSDoc block adhering to the following structure:

```typescript
/**
 * @testType Unit Test
 * @target FirebaseAuthGuard.canActivate
 * @description Verifies that access is granted and the decoded token payload is attached to the request when a valid Bearer token is provided.
 */
it('should allow access if token is valid', async () => {
  // ...
});
```

For module integration tests:

```typescript
/**
 * @testType Integration Test
 * @target CommonModule
 * @description Verifies that the NestJS DI container compiles CommonModule and successfully resolves all exported controllers, services, and factory providers.
 */
it('should compile CommonModule and resolve controllers and providers', async () => {
  // ...
});
```

### 5.3 Enforcement
During code reviews and verification, test files will be checked to confirm:
1. No test case is missing the `@testType` tag.
2. The classification (`Unit Test` vs `Integration Test`) accurately matches the test's scope and mocking level.
3. The `@description` clearly explains the requirement being exercised.
