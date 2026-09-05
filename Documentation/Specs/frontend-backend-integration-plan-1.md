# Frontend & Backend Integration Plan 1

## Overview
This document outlines the extensive strategy for integrating the Next.js frontend with the NestJS backend API. The integration relies on Firebase Authentication as the identity bridge, utilizing ID tokens for secure, stateless authorization against backend controllers.

## Integration Architecture

### 1. The Auth Bridge & API Client
**Objective**: Ensure every frontend request securely identifies the user to the backend.
- **Firebase Auth Context**: The frontend will initialize Firebase Auth and wrap the application in an Auth Provider to expose the `currentUser`.
- **API Wrapper**: A centralized fetch wrapper (e.g., `apiClient.ts`) will be implemented. Before executing any network request to the NestJS backend, it will await `firebase.auth().currentUser.getIdToken()`.
- **Header Injection**: The API wrapper injects `Authorization: Bearer <token>` into the request headers.

### 2. Route Protection (Frontend)
**Objective**: Prevent unauthenticated access to the application.
- **Client-Side/Server-Side Guards**: Implement Next.js Middleware (or higher-order components) to automatically redirect unauthenticated users to `/login`.
- **Public Routes**: Only `/login` will remain unprotected.

### 3. Data Sync Strategies

#### Dashboard (Timeline & Editor)
- **Timeline Fetching**: Use SWR or React Query to call `GET /api/entries`. This provides caching, revalidation on focus, and optimistic UI updates.
- **Autosave Logic**: The debounced editor state from Task 2 will trigger a `POST /api/entries/autosave` payload containing the raw Markdown.
- **Error Handling**: If an autosave fails (e.g., 500 error or network drop), the UI must transition from "Saving..." to a red "Sync Failed. Retrying..." state, storing the draft locally until the network restores.

#### AI Companion (Chat)
- **Streaming Responses**: The backend will likely utilize streaming (Server-Sent Events) for the AI response generation. The frontend must implement a stream consumer to render chat bubbles incrementally.
- **Draft Action Binding**: Clicking "Save as New Entry" on an AI draft will fire a `POST /api/entries` request with the draft payload.

#### Semantic Search
- **Query Execution**: The search overlay from Task 4 will hit `GET /api/search?q={query}`. 
- **Debouncing**: Input will be debounced by 400ms to prevent overwhelming the vector search backend while the user is typing.

#### Account & Settings
- **State Sync**: Toggle states (like Habit Memory) will fire immediate `PATCH /api/settings` requests.
- **Account Deletion**: The Danger Zone will trigger `DELETE /api/account`. Upon a `200 OK` response, the frontend will call `firebase.auth().signOut()` and redirect to `/login`.

## Implementation Sequence
1. Implement Firebase Auth config and Context Provider in `layout.tsx`.
2. Build the `apiClient.ts` wrapper.
3. Replace mock data arrays in `app/page.tsx`, `chat/page.tsx`, and `search/page.tsx` with SWR/Fetch calls.
4. Implement the streaming chunk parser for the chat UI.
