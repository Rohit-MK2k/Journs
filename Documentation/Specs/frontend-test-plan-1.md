# Frontend Test Plan 1 (Pre-Integration)

## Overview
This document outlines the extensive Test-Driven Development (TDD) plan for the Journ Next.js frontend. These tests will be written and validated against the existing UI components before we begin the actual API and Firebase integration.

## Testing Stack
- **Runner & Assertion**: Jest
- **DOM Rendering & Interaction**: React Testing Library (RTL) & `@testing-library/user-event`
- **Scope**: Unit (Functions/Hooks) and Component/Integration (UI behaviors).

## Mocking Strategy
To ensure the frontend is tested in isolation prior to backend integration:
1. **Router**: Mock `next/navigation` (`useRouter`, `usePathname`).
2. **Auth**: Mock the future Firebase Auth hooks (e.g., overriding a dummy `useAuth` hook to return a mock `user` object).
3. **Network**: Mock global `fetch` to intercept and assert payload structures for future NestJS API connections.

---

## Extensive Test Suites

### Suite 1: Authentication (`/login`)
- **T1.1 Rendering**: Asserts that the "Journ" wordmark, philosophical quote, and "Continue with Google" button render correctly.
- **T1.2 Interaction**: Simulates a click on the OAuth button. 
  - *Expectation*: Invokes the mocked Firebase login function and triggers `router.push("/")`.

### Suite 2: Main Dashboard (`/`)
- **T2.1 Editor Autosave Debounce**:
  - Simulates typing into the editor textarea.
  - *Expectation*: Header status changes to `"Saving..."`.
  - Advances Jest timers by 1000ms.
  - *Expectation*: Header status changes to `"Saved"`.
  - Advances timers by 2000ms.
  - *Expectation*: Status text disappears.
- **T2.2 Timeline Rendering**: Asserts that mock timeline cards render relative dates and AI summary text.
- **T2.3 Expanded Entry State**:
  - Simulates a click on the first timeline card.
  - *Expectation*: The timeline unmounts, and the expanded view mounts showing the unabridged snippet and media tags.
- **T2.4 Return to Timeline**:
  - While in the expanded view, clicks "← Timeline".
  - *Expectation*: Expanded view unmounts, timeline restores.

### Suite 3: AI Companion (`/chat`)
- **T3.1 Mode Toggling**:
  - Simulates clicking the "Voice" toggle.
  - *Expectation*: Text chat UI unmounts, concentric pulse UI mounts.
- **T3.2 Draft Editing Transition**:
  - In Text mode, clicks "Edit Text" on the Drafted Journal Note Card.
  - *Expectation*: Main chat unmounts, full-screen "Edit Drafted Note" view mounts with textarea matching draft content.
- **T3.3 Draft Destination Logic**:
  - In Edit mode, selects "Create as New Separate Entry" radio.
  - *Expectation*: Component state updates correctly.
- **T3.4 Draft Discard/Save**:
  - Clicks "Discard Draft" or "Save".
  - *Expectation*: State resets back to Text mode. (Later, "Save" will assert a mocked `fetch` call).

### Suite 4: Semantic Search (`/search`)
- **T4.1 Auto-Focus**: Asserts that the input field has `document.activeElement` focus on mount.
- **T4.2 Search Submission**:
  - Types "architecture" into the input and submits the form.
  - *Expectation*: "Suggested Reflections" unmounts, mock "Semantic Match" cards mount.
- **T4.3 Clear Input**:
  - Clicks the `×` button inside the search pill.
  - *Expectation*: Query clears, focus returns to input, UI reverts to suggestions.
- **T4.4 Escape Key Transition**:
  - Fires an `Escape` keydown event on the window.
  - *Expectation*: Sets `isExiting` state (asserting opacity class change), advances timer by 300ms, and asserts `router.push("/")` is called.

### Suite 5: Account & Settings (`/settings`)
- **T5.1 Theme Selector**:
  - Clicks "Dark (Charcoal)".
  - *Expectation*: The active CSS class/state moves to the Dark button.
- **T5.2 Habit Memory Toggle**:
  - Clicks the custom switch.
  - *Expectation*: Checkbox state flips, and Tailwind translation classes update from `translate-x-6` to `translate-x-1`.
- **T5.3 Danger Zone Safeguard (Critical)**:
  - Asserts the "Permanently Wipe All Data" button is `disabled`.
  - Types "DELET" into the confirmation input.
  - *Expectation*: Button remains `disabled`.
  - Types "E" (making it "DELETE").
  - *Expectation*: Button becomes enabled.
  - Types "d" (making it "DELETEd").
  - *Expectation*: Button reverts to `disabled`. 
