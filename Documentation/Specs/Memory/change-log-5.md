# Change Log 5 - Spec Memory

**Date:** 2026-09-06  
**Log ID:** `change-log-5`  
**Scope:** Resolved Google OAuth authentication freeze by replacing `signInWithRedirect` with `signInWithPopup`, added `getRedirectResult` lifecycle resolution fallback, implemented user-facing error state banners, and fixed backend development port collision with frontend `PORT=3000`.

---

## 1. Summary of Commits

| Commit Hash | Type / Scope | Description |
|-------------|--------------|-------------|
| `1a645c4` | `fix(backend)` | Isolate dev port from prod PORT: prioritize BACKEND_PORT in development to prevent collision with PORT=3000 |
| `d6bb4b6` | `fix(auth)` | Use popup login and resolve redirects: switch to signInWithPopup, add getRedirectResult fallback, and render error alerts |

---

## 2. Core Architectural & Code Changes

### 2.1 Google OAuth Popup Flow & Redirect Resolution (`frontend/src/app/login/`)
- **Elimination of Third-Party Storage Partitioning Drop:** Replaced `signInWithRedirect` with `signInWithPopup` in `frontend/src/app/login/page.tsx`. `signInWithPopup` executes Google authentication within a focused child window on the same browser origin, bypassing cross-origin cookie and storage partitioning restrictions enforced on `localhost` by Chromium and WebKit.
- **Immediate Credential Resolution:** Resolved user credentials directly in the asynchronous handler (`const credential = await signInWithPopup(...)`), allowing immediate route transitions via `router.push('/')` without relying on full page reloads or external callback hops.
- **Redirect Result Lifecycle Handler:** Added `getRedirectResult(auth)` inside `useEffect` on page mount to gracefully resolve any credentials initiated from redirects (such as environments where popups are blocked).
- **Graceful Degradation & Fallback:** Configured `handleLogin` to automatically fall back to `signInWithRedirect` if a strict browser popup blocker rejects the popup window (`error.code === 'auth/popup-blocked'`).
- **Visual Error Feedback:** Added an authentication error alert box to the login UI to display Firebase error messages (e.g., unauthorized domain, network interruption) rather than failing silently.
- **Test Harness Mock Alignment:** Updated `frontend/jest.setup.ts` to mock `getRedirectResult: jest.fn().mockResolvedValue(null)`.

### 2.2 Local Development Server Port Isolation (`src/main.ts`)
- **Port Conflict Resolution:** Corrected port resolution in `src/main.ts` to `process.env.BACKEND_PORT || (process.env.NODE_ENV === 'production' ? process.env.PORT : undefined) || 8000`.
- **Context Separation:** Prevented the backend from capturing `PORT=3000` (which is designated for Next.js in `.env`) during local development, ensuring NestJS cleanly listens on port 8000 while preserving Cloud Run dynamic `PORT=8080` allocation in production containers.

---

## 3. Verification & Test Coverage

- **Frontend Tests:** 7/7 test suites passed (38 total unit tests, including authentication rendering and interaction).
- **Backend Tests:** 32/32 test suites passed (172 total unit and integration tests).
- **Live Local Verification:** Confirmed `http://localhost:3000/login` loads with HTTP 200, backend health check responds on `http://localhost:8000/health`, and Next.js proxy rewrite routes `http://localhost:3000/api/health` with HTTP 200.
