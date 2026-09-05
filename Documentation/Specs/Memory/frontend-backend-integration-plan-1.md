# Frontend-Backend Integration Phase 1 Memory

## Summary
Successfully integrated the Next.js UI with Firebase Authentication and prepared the foundational logic for secure, authenticated requests to the upcoming NestJS backend. 

All Next.js routes are now securely wrapped, and tests have been updated to ensure robustness. 

## Completed Tasks

1. **Authentication State & Route Protection**:
   - Integrated `firebase/auth` and implemented Google OAuth via popup in `login/page.tsx`.
   - Created `AuthGuard.tsx` to handle client-side route protection. It verifies synchronous authentication state to prevent UI flashes and uses `onAuthStateChanged` to gracefully redirect unauthenticated users to `/login`.
   - Wrapped `app/page.tsx`, `app/chat/page.tsx`, `app/search/page.tsx`, and `app/settings/page.tsx` with `<AuthGuard>`.

2. **Backend API Connectivity**:
   - Developed `src/lib/apiClient.ts` as a native `fetch` wrapper.
   - Designed it to dynamically retrieve the current user's JWT via `await firebase.auth().currentUser.getIdToken()`.
   - Injected the JWT as a `Bearer` token inside the `Authorization` header on all outgoing requests.
   - Connected `page.tsx` (Autosave functionality) and `settings/page.tsx` (Account Deletion) to utilize `apiClient`.

3. **Session Management**:
   - Implemented Firebase `signOut` functionality in the `AccountSettings` component.
   - Implemented `apiClient('/api/account', { method: 'DELETE' })` to safely signal the backend to wipe vector and firestore data, followed by a client-side Firebase logout.

4. **Testing Suite Stabilization**:
   - Modified `jest.setup.ts` to globally mock `firebase/auth`, `next/navigation` (`useRouter`, `usePathname`), and the global `fetch` API.
   - Resolved integration-induced test failures caused by async microtasks, promise rejections, and DOM state mismatches when rendering `<AuthGuard>`.
   - Identified and fixed a legitimate UI bug in `search/page.tsx` where the `AuthGuard` wrapper caused the component's `useEffect` to fire before the input mounted, breaking auto-focus. Fixed by switching to the native `autoFocus` prop.
   - All 19 Next.js frontend UI/Integration tests now reliably pass.

## Remaining Considerations
- The current backend endpoints (e.g., `/api/entries/autosave`, `/api/search`) are mocked to return 200 OK by `apiClient.test.ts`. Once the backend infrastructure is deployed on port 3001, `apiClient.ts` may need its `NEXT_PUBLIC_API_URL` updated.
- Caching tools like `SWR` are imported but not heavily utilized yet since most data flow involves creating items or interacting with streams.

The frontend is now fully primed to connect with the Backend Infrastructure and Business Logic layers specified in tasks 3.
