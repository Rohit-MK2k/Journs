# Backend Infrastructure & Presentation Task 6: API Gateway & Controller Contracts

## Overview
To support the frontend integration plan (`frontend-backend-integration-plan-1.md`), the NestJS API presentation layer must implement specific Controller endpoints that match the expected frontend data contracts.

## Required Controllers & Endpoints

### 1. EntriesController (`/entries`)
- **`GET /`**: Returns a paginated list of the user's past journal entries. Must include metadata (word count, AI summaries, media attachments).
- **`POST /autosave`**: Accepts a partial entry payload (e.g., `text`, `timestamp`). Must cleanly handle rapid debounced updates from the frontend. Upserts the "Today" entry.
- **`POST /`**: Accepts a full entry payload (used when saving standalone AI drafts).

### 2. ChatController (`/chat`)
- **`POST /message`**: Accepts a conversational query. Must support returning a Server-Sent Events (SSE) stream for real-time text rendering on the frontend.
- **`POST /voice`**: (Future) Accepts an audio blob, returns transcribed text and AI voice synthesis response.

### 3. SearchController (`/search`)
- **`GET /`**: Accepts `?q=string`. Must route to the vector/semantic search business logic and return an array of matched entries, including the calculated percentage `matchScore` and extracted `semanticChips`.

### 4. AccountController (`/account`)
- **`PATCH /settings`**: Updates user preferences (e.g., Habit Memory toggles).
- **`DELETE /`**: Triggers the cascading deletion of the user's account data.

## Guards & Interceptors
- Every endpoint listed above MUST be protected by the `FirebaseAuthGuard` which decodes the Bearer token, extracts the `uid`, and validates it against Firebase Admin before allowing the request to proceed.
