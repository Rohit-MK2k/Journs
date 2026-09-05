# DESIGN.md — Journ Design System & UI Specification for Google Stitch

## 1. Product Identity & Purpose

- **Application Name**: Journ
- **Category**: Minimalist Personal Journal & Reflective AI Companion
- **Core Value Proposition**: Lower the friction of personal writing to near zero while maintaining absolute privacy and a supportive, distraction-free environment.
- **Mental Model**: "The Cake" architecture:
  - **The Cake (Non-negotiable core)**: Write (create entry) → Persist (silent autosave) → Read (chronological review).
  - **Layered Enhancements**: Optional attachments (voice audio clip, photo, text location tag), AI 1-line timeline summaries, natural language search, and an empathetic AI companion.
- **Visual Tone & Vibe**: Calm, editorial, quiet, tactile, uncluttered. Feels like high-quality paper and ink translated to a digital canvas. Never feels like a productivity dashboard or social media feed.

---

## 2. Visual Foundations & Design Tokens

### 2.1 Color Palette

Designed with high legibility and subdued contrast to reduce cognitive load and eye strain.

#### Light Mode (Primary Canvas)
- **Background / Canvas (`bg-canvas`)**: `#FAFAF9` (Warm stone/off-white, paper-like)
- **Surface / Card (`bg-surface`)**: `#FFFFFF` (Pure white for elevated cards and inputs)
- **Surface Subdued (`bg-subtle`)**: `#F4F4F5` (Soft gray for chips, attachment pills, secondary states)
- **Border Default (`border-default`)**: `#E4E4E7` (Subtle 1px border lines)
- **Border Focus (`border-focus`)**: `#18181B` (High-contrast neutral focus indicator)
- **Text Primary (`text-primary`)**: `#18181B` (Near black, deep zinc)
- **Text Secondary (`text-secondary`)**: `#71717A` (Muted neutral for metadata, timestamps, placeholders)
- **Text Tertiary / Subtle (`text-tertiary`)**: `#A1A1AA` (Low contrast for secondary hints and borders)
- **Accent / Action Primary (`accent-primary`)**: `#18181B` (Dark slate/black for primary actions)
- **Accent Soft (`accent-soft`)**: `#F4F4F5` (Subtle hover background)
- **Status - Subtle Save (`status-saved`)**: `#16A34A` (Soft green text label for saved state, fades out)
- **Status - Destructive (`status-danger`)**: `#DC2626` (Muted red strictly reserved for account deletion)

#### Dark Mode
- **Background / Canvas (`bg-canvas`)**: `#121214` (Deep charcoal, warm black)
- **Surface / Card (`bg-surface`)**: `#18181B` (Elevated surface container)
- **Surface Subdued (`bg-subtle`)**: `#27272A`
- **Border Default (`border-default`)**: `#27272A`
- **Border Focus (`border-focus`)**: `#F4F4F5`
- **Text Primary (`text-primary`)**: `#F4F4F5` (Soft white)
- **Text Secondary (`text-secondary`)**: `#A1A1AA`
- **Text Tertiary / Subtle (`text-tertiary`)**: `#71717A`
- **Accent / Action Primary (`accent-primary`)**: `#F4F4F5`
- **Accent Soft (`accent-soft`)**: `#27272A`

### 2.2 Typography Scale

- **Headline Font**: `Newsreader` or `Plus Jakarta Sans` (Editorial serif or clean humanist sans)
- **Body Font**: `Inter` or `Literata` (Optimized for deep reading, generous x-height)
- **Label / Meta Font**: `Inter`

| Level | Size | Line Height | Weight | Tracking / Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 32px / 2rem | 1.25 | 600 (SemiBold) | -0.02em | Date Header ("Today", "Wednesday, Sept 4") |
| `headline-md` | 24px / 1.5rem | 1.35 | 500 (Medium) | -0.015em | Modal titles, Chat headers |
| `body-lg` | 18px / 1.125rem | 1.65 | 400 (Regular) | 0 | Journal writing editor, expanded reading view |
| `body-md` | 15px / 0.9375rem | 1.55 | 400 (Regular) | 0 | Timeline preview text, chat messages |
| `label-md` | 13px / 0.8125rem | 1.4 | 500 (Medium) | +0.01em | Attachment chips, AI 1-line summary gists |
| `caption-sm` | 12px / 0.75rem | 1.3 | 400 (Regular) | +0.02em | Timestamp labels, quiet autosave indicator |

### 2.3 Spacing & Layout Grid

- **Base Grid Unit**: 4px
- **Scale**: `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `12` (48px)
- **Container Max-Width**: `680px` (Strictly centered, single-column reading and writing canal)
- **Viewport Padding**: 16px on mobile (`<640px`), 24px on desktop (`>=640px`)
- **Touch Targets**: Minimum `44px x 44px` for all interactive elements

### 2.4 Shape & Elevation

- **Roundness Tokens**:
  - Small / Chips / Tags: `6px` or `8px` (`ROUND_EIGHT`)
  - Entry Cards / Surfaces: `12px` (`ROUND_TWELVE`)
  - Floating Action Buttons / Modals: `16px` to full pill (`ROUND_FULL`)
- **Elevation / Shadows**:
  - Flat by default. Separation is achieved through subtle `1px solid var(--border-default)` borders and background tone shifts.
  - Floating Action Button (FAB) & Modals: Minimal soft shadow (`0 4px 20px rgba(0, 0, 0, 0.06)` in light mode, `0 4px 20px rgba(0, 0, 0, 0.35)` in dark mode).

---

## 3. Screen Specifications

### Screen 1: Authentication / Sign-In (`/login`)
- **Layout**: Centered minimal stack on full-screen canvas.
- **Elements**:
  - Wordmark: "Journ" in editorial serif, letter-spaced, subdued.
  - One-line statement: "A quiet space for your thoughts."
  - Primary Action Button: "Continue with Google" with official Google "G" icon. White or subtle gray surface with 1px border.
  - Subtext: "Your journal is private and tied to your Google account."
- **Behavior**: Single-click OAuth. No signup flow, no password field, no marketing carousel.

### Screen 2: Main Dashboard — Today's Entry & Timeline (`/`)
- **Header**:
  - Minimal navigation bar (56px height).
  - Left: "Journ" minimal wordmark or current date anchor.
  - Center: Quiet autosave status (`"Saving..."` / `"Saved"` in `caption-sm` green text that dissolves after 2s).
  - Right: Search button (magnifying glass icon) and User Avatar (Google profile thumbnail, 32px diameter circle).
- **Primary Section — The Editor (Today's Entry)**:
  - Topmost component, auto-focused on initial load.
  - Date Title: "Today — Wednesday, Sept 4" (`display-lg`).
  - Distraction-Free Text Area: Auto-growing `textarea` or rich plain text. Soft rotating placeholder when empty (e.g., *"What's on your mind today?"*).
  - Attachment Bar (Anchored subtly below text):
    - Minimal horizontal row of icon buttons: Microphone (Voice), Image (Photos), Pin (Location).
    - Existing attachments render as compact horizontal chips:
      - **Voice**: Compact inline audio player with play/pause button, duration label (`0:42`), and mini waveform.
      - **Photos**: Square thumbnail grid (72px x 72px) with remove button (`×`).
      - **Location**: Small pill badge with pin icon and text label (e.g., *"Blue Bottle Coffee, SF"*).
  - No "Save" or "Submit" button anywhere in the editor.
- **Secondary Section — Timeline (Past Entries)**:
  - Sits directly below the editor with a subtle dividing space.
  - Timeline Header: "Recent Entries" in muted small-caps label.
  - Chronological Cards (Newest first):
    - **Header Row**: Formatted Date (`"Yesterday"`, `"Aug 31"`) + Attachment indicators (mini icons if voice, photos, or location exist).
    - **AI 1-line Summary**: Distinctive highlighted single sentence in italic or soft background tint (e.g., *"Reflected on client feedback and planned morning walk."*).
    - **Preview Text**: First 2 lines of original text fading out with ellipsis.
    - **Tap Interaction**: Expanding card transition revealing full text and playable media inline, without navigating to a detached page.
- **Floating Action Button (AI Companion FAB)**:
  - Bottom-right corner (fixed, 24px from edges).
  - Circular or rounded pill button (48px height) with subtle chat bubble / wave icon.

### Screen 3: AI Companion Chat (`/chat` or Modal/Drawer)
- **Presentation**: Slide-up sheet on mobile, slide-in side drawer or centered modal on desktop.
- **Header**:
  - Title: "Reflect" or companion status.
  - Mode Switcher: Toggle between "Text Chat" and "Live Voice".
  - Close button (`×`).
- **Chat Transcript**:
  - Conversational bubbles. User messages aligned right (subtle gray container), AI responses aligned left (transparent container with subtle left border).
  - Opening Greeting: Contextual dynamic question derived from recent journal entries (e.g., *"Yesterday you mentioned preparing for the presentation. How did it feel?"*).
- **Inline Draft Card (Context-Driven Journaling)**:
  - When the user asks to save something, or when AI identifies a meaningful moment:
  - Distinct bordered card inside the chat stream labeled: **"Drafted Entry"**.
  - Shows proposed journal text.
  - Interactive Action Row:
    - Primary: "Save to Today's Entry"
    - Secondary: "Save as New Entry"
    - Tertiary: "Edit Text"
    - Dismiss: "Discard"
- **Input Bar**:
  - Clean input container with text input field, microphone button for voice capture, and send button.

### Screen 4: Search Overlay
- **Triggered by**: Search icon in header.
- **Layout**: Full-screen modal overlay with auto-focused search bar at top.
- **Search Bar**: Placeholder: *"Ask or search anything (e.g., 'when was I stressed about moving')..."*
- **Results Feed**: List of entry cards ranked by semantic relevance, highlighting matching concepts and date.

### Screen 5: Settings / Account Management
- **Presentation**: Popover dropdown or clean modal.
- **Content**:
  - Google Account display: Avatar, Full Name, Email.
  - Theme Toggle: System / Light / Dark.
  - Danger Zone:
    - "Delete Account and Data": High-friction red action.
    - Triggers modal requiring user to type confirmation text before permanently wiping Firestore documents, attachments, and habit memory.
  - Logout Button.

---

## 4. UI Patterns & Micro-Interactions

1. **Auto-focus**: When the home page mounts, the text cursor must immediately land in today's entry text area, ready to accept typing without any clicking.
2. **Silent Autosave Feedback**:
   - As the user types, a tiny label in the navigation bar displays `Saving...` in muted zinc.
   - After a 800ms debounce pause, it transitions to `Saved` in muted green and fades to 0% opacity over 2 seconds.
   - Never show alert popups or toast notifications for saving.
3. **Voice Attachment Interaction**:
   - Audio is saved as an audio clip.
   - Audio player shows a lightweight custom scrubber/waveform.
   - The AI transcript is generated entirely in the background for vector indexing and search; **never display the raw transcript in the entry UI**.
4. **Draft Approval Guardrail**:
   - Any AI-generated text must be confirmed through the Draft Card UI before writing to the database.

---

## 5. Strict Constraints & Anti-Patterns ("What Stitch Should NOT Do")

When generating screens and UI components, Stitch must adhere strictly to these negative constraints:

- **DO NOT create a manual "Save", "Submit", or "Publish" button** for journal entries. Saving is strictly automatic and debounced.
- **DO NOT add intrusive toast notifications or alert boxes** on every autosave.
- **DO NOT add onboarding carousels, feature walkthrough popups, or multi-step wizard screens**. First-time users must immediately land on today's empty entry editor.
- **DO NOT add social features**: No like buttons, share icons, comment threads, follower counts, or public profile pages. Journ is strictly private.
- **DO NOT add gamification or guilt-tripping elements**: No streak counters, fire icons, habit checkmarks, or "You missed 3 days" banners.
- **DO NOT add mood rating widgets or emotion scores**: No daily emoji mood pickers (e.g. rate your mood 1-5), mood analytics graphs, or emotional diagnostic badges.
- **DO NOT add heavy interactive maps**: Location attachments must be displayed as a simple text pill/tag, not an embedded Google Map or satellite view.
- **DO NOT show voice transcripts as the entry body**: The voice note is an audio attachment; its transcript is strictly internal for AI search and summaries.
- **DO NOT allow AI to overwrite or alter the user's saved text silently**: Any AI-drafted journal content must require user interaction with the Draft Card.
- **DO NOT use flashy, neon, or hyper-vibrant color schemes**: Maintain an editorial, calm, and grounded palette (stone, zinc, paper tones).
- **DO NOT build cluttered multi-column dashboard layouts**: Keep the primary reading and writing canal centered and single-column (max 680px).
