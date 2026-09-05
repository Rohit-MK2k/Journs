# Frontend Test Plan 2 (Integration Phase)

## Overview
This document extends the initial test plan to cover the new integration dynamics. Now that the frontend will be connecting to real (or emulated) backend services, the test suite must account for network behaviors, authentication guards, and asynchronous streaming.

## New Integration Test Suites

### Suite 6: API Client & Authorization
- **T6.1 Token Injection**: 
  - Mount the custom API fetch wrapper in isolation.
  - *Expectation*: Verifies that `firebase.auth().currentUser.getIdToken()` is called, and asserts the resulting HTTP request headers contain `Authorization: Bearer <mocked-token>`.
- **T6.2 Unauthenticated Rejection**:
  - Simulates a request when no user is logged in.
  - *Expectation*: The API wrapper aborts the request and throws an authentication error before hitting the network.

### Suite 7: Protected Routes & Auth Guards
- **T7.1 Unauthenticated Redirect**:
  - Mock Firebase Auth state to return `null` (no user).
  - Attempt to render the `/` Dashboard or `/settings` page.
  - *Expectation*: Next.js Middleware or client-side guard triggers a router redirect to `/login`.
- **T7.2 Authenticated Access**:
  - Mock Firebase Auth state to return a valid user.
  - *Expectation*: The protected routes render their content without redirecting.

### Suite 8: Network Error Handling & Fallbacks
- **T8.1 Autosave Network Failure**:
  - On the Dashboard, simulate typing in the editor.
  - Mock the `POST /api/entries/autosave` endpoint to return a `500 Internal Server Error`.
  - *Expectation*: The UI transitions from "Saving..." to a distinct "Sync Failed" or error state, ensuring the user knows their data is not persisted remotely.
- **T8.2 Data Fetch Retry Logic**:
  - Mock a transient failure on the initial `GET /api/entries` request.
  - *Expectation*: SWR/React Query triggers a retry, and the UI displays a skeleton loader until data successfully resolves.

### Suite 9: Streaming Response UI
- **T9.1 Chat Stream Rendering**:
  - On the Chat interface, submit a message.
  - Mock the backend `POST /chat/message` to return a Server-Sent Events (SSE) stream.
  - Emit data chunks sequentially in the test environment.
  - *Expectation*: Asserts that the Assistant chat bubble renders incrementally, matching the concatenated chunks.
