# Frontend-Backend Integration Phase 2

**Date:** 2026-09-05
**Scope:** Finalizing Data Integration and Removing Mock Data
**Target:** `frontend/src/app/page.tsx` and `frontend/src/app/search/page.tsx`

## Overview
This is Task 2 for the Frontend-Backend Integration layer. The UI components are built and the NestJS backend endpoints are fully operational. The goal of this task is to strip the remaining hardcoded mock data from the React frontend and wire it securely to the live backend APIs using `apiClient`.

---

## 1. Dashboard Integration (`src/app/page.tsx`)

**Context:** The timeline and editor currently rely on static fake data and hardcoded entry IDs.

### Implementation Tasks
- **Dynamic Timeline Retrieval:**
  - Remove the `MOCK_PAST_ENTRIES` array entirely.
  - Implement a `useEffect` or integrate `SWR` to fetch the user's timeline on mount via `GET /api/entries`.
  - Map the returned `EntrySummary` array into the timeline UI, ensuring dates, snippets, and AI summaries render dynamically.
- **Dynamic Entry ID Binding:**
  - The `autosaveEntry` API call currently returns the saved `Entry` object (including its real database `id`). Capture this `id` in the component's state.
  - Update `handleUpload` (for attachments) and `handleBlur` (for AI summaries) to use this dynamic state ID instead of the hardcoded `"123"` when making `POST /api/entries/:id/...` network requests.

### Required Test Cases (React Testing Library)
- `should fetch and render the user's timeline entries on initial mount`.
- `should capture the real entry ID from the autosave response and use it for subsequent attachment uploads`.
- `should capture the real entry ID from the autosave response and use it to trigger summary generation on blur`.

---

## 2. Semantic Search Integration (`src/app/search/page.tsx`)

**Context:** The search overlay is completely mocked and bypasses the network.

### Implementation Tasks
- **Dynamic Query Execution:**
  - Update `handleSearch` to execute a real API request to the backend search endpoint (e.g., `GET /api/search?q=...`) using `apiClient`.
  - Maintain a loading state while awaiting the results from the Vertex AI vector search.
- **Result Mapping:**
  - Remove the hardcoded HTML representing the 98%, 81%, and 74% semantic matches.
  - Map over the actual JSON response array (which contains `matchScore`, `semanticChips`, and the entry `snippet`) and render the cards dynamically based on the backend data.

### Required Test Cases (React Testing Library)
- `should display a loading indicator while the search API request is in flight`.
- `should execute the search API call with the correct query parameters and render the dynamic results`.
- `should display an empty state or fallback message if the search returns zero results`.

---

## References

This integration directly connects the features implemented and finalized in the following specification documents:

- **Business Logic Layer:** [business-logic-layer-5.md](../Memory/business-logic-layer-5.md) (Core domain logic for attachments, chat, and summaries).
- **Backend Infrastructure & Presentation:** [backend-infrastructure-presentation-8.md](../Memory/backend-infrastructure-presentation-8.md) (Endpoints and Gemini/Firebase integrations).
- **Frontend UI Layer:** [frontend-ui-6.md](../Memory/frontend-ui-6.md) (Visuals for idle prompts, attachment controls, and chat states).
