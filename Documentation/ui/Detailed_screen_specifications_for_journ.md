# SPECS.md — Comprehensive Screen & UI Specifications for Journ

> **Authoritative Specification Document**  
> Formulated strictly from `SCOPE.md`, `UI_DOCUMENTATION.md`, `ARCHITECTURE.md`, and `DESIGN.md`.  
> This specification maps every application page, its constituent screen states, responsive viewport requirements, themes, visual tokens, functional micro-interactions, and strict negative constraints.

---

## 1. Application Architecture & High-Level Page Hierarchy

According to the product scope (`SCOPE.md` & `UI_DOCUMENTATION.md`), **Journ** is structured around **5 fundamental pages/views**, featuring **12 canonical desktop screens** and their matching **12 mobile counterparts**, across **2 visual themes** (Light Warm Paper & Dark Charcoal).

### Summary Matrix: Pages vs. Screen States

| Page / Primary View | Route / Mode | Number of Screen States | Screen State Names | Supported Viewports & Themes |
| :--- | :--- | :---: | :--- | :--- |
| **Page 1: Authentication** | `/login` | **1** | 1. Sign In / Landing | Desktop & Mobile (Light & Dark) |
| **Page 2: Main Dashboard (The Cake)** | `/` | **4** | 1. Default Blank / Writing State<br>2. Merged / Appended Reflection State<br>3. Expanded Past Entry View<br>4. Full Entry In-situ Expanded View | Desktop & Mobile (Light & Dark) |
| **Page 3: AI Companion** | `/chat` or Modal/Drawer | **3** | 1. Conversational Chat (Context Drafting)<br>2. Live Voice Interactive Mode<br>3. Dedicated Full-Screen Edit Draft Mode | Desktop & Mobile (Light & Dark) |
| **Page 4: Search & Semantic Recall** | `/search` or Overlay | **3** | 1. Search Query & Overlay<br>2. Natural Language Highlighted Results<br>3. Transition / Reverse Transition State | Desktop & Mobile (Light & Dark) |
| **Page 5: Account & Settings** | `/settings` or Drawer/Modal | **1** | 1. Account Profile, Theme & Data Deletion | Desktop & Mobile (Light & Dark) |

**Total Canonical Views**: **5 Core Pages** composed of **12 Unique Screen States** (24 screens per theme across Desktop & Mobile, 48 total variations).

---

## 2. Detailed Screen Specifications by Page

---

### Page 1: Authentication & Sign-In (`/login`)

#### Purpose & Mental Model
A private, distraction-free authentication gateway. Google OAuth is the **only** account mechanism—no email/password forms, no password resets, and no marketing or onboarding wizards.

#### Screens Under This Page:
1. **Screen 1.1: Sign In Screen**
   - **Route**: `/login`
   - **Layout**: Centered, distraction-free card floating on full canvas.
   - **Key Components**:
     - *Header/Category Label*: Subtle uppercase tag (`• EDITORIAL JOURNALING •`).
     - *Brand Mark*: `Journ` wordmark set in serif (`Newsreader`), medium weight, negative tracking.
     - *Statement*: `"A quiet space for your thoughts."` in secondary body tone.
     - *OAuth Action Button*: `"Continue with Google"` button containing the official Google 4-color "G" glyph. Flat surface, subtle 1px border.
     - *Trust Assurance Block*: Small lock icon with `"Private by design"` label and copy: `"Tied securely to your Google account with end-to-end user isolation. No unsolicited notifications, feeds, or profiling."`
     - *Philosophical Anchor*: Subdued quote (*"Quiet the mind, and the soul will speak."*).
     - *Footer Bar*: Left: `"Journ System"`; Right: `"Privacy · Terms"`.
   - **Interaction & Redirect**: Single click initiates Google OAuth flow. Upon successful authentication, the user is redirected **immediately** to the Main Dashboard with the text cursor auto-focused on today's entry.

---

### Page 2: Main Dashboard — "The Cake" (`/`)

#### Purpose & Mental Model
The core of the application: Write (create entry) → Persist (silent autosave) → Read (chronological timeline). Text is the primary medium; voice audio, photos, and location tags are optional layered attachments.

#### Screens Under This Page:

1. **Screen 2.1: Default Today's Entry & Timeline (Writing State)**
   - **Header Bar**:
     - Wordmark `"Journ"` or date anchor.
     - Center: Quiet autosave status label (`"Saving..."` in muted zinc, debounced transition to `"Saved"` in soft green, fading to 0% opacity within 2s).
     - Right: Search trigger icon and Google User Avatar (32px circle).
   - **The Editor (Today's Entry)**:
     - Auto-focused on page mount; keyboard opens automatically on mobile.
     - Date Headline: `"Today — Wednesday, Sept 4"` in `Newsreader` display typography.
     - Editor Textarea: Dynamic height, comfortable typography (18px, 1.65 line height). Empty state features a soft, static, non-AI rotating prompt (e.g., *"What's on your mind today?"*).
     - Attachment Control Row: Minimalist icons for Voice (Microphone), Photo (Image), and Location (Pin).
     - Active Attachments: Audio player chip (custom waveform, play/pause, duration badge), photo thumbnail grid (72x72px with `×` remove button), and location text pill (e.g., `"Blue Bottle Coffee, SF"`).
     - **Negative Rule**: Absolutely NO manual "Save", "Submit", or "Publish" button.
   - **The Timeline (Past Entries)**:
     - Header: `"Recent Entries"` with entry count.
     - Chronological Cards (newest first): Date label (`"Yesterday"`, `"Monday, Sept 2"`), 1-line AI-generated summary in subtle callout box, 2-line snippet fading with ellipsis, and media icon indicators (voice, photo, location).
   - **AI Companion FAB**:
     - Bottom-right corner floating pill/circle (48px) with subtle spark/waveform glyph.

2. **Screen 2.2: Today & Timeline with Appended/Merged Reflection**
   - **Context**: State after the user confirms an AI Companion conversation draft to merge into "Today's Entry".
   - **Layout Details**:
     - Today's entry now displays a dedicated sub-section labeled: `● Midday Reflection • Added via Companion at 10:48 AM [Appended]`.
     - Displays the synthesized text seamlessly integrated within the single calendar-day container.
     - Embedded snippet player for the linked voice snippet (e.g., `0:24`).
     - Autosave indicator confirms persistence: `"Saved just now"`.

3. **Screen 2.3: Expanded Past Entry View (Dedicated In-Situ/Canvas View)**
   - **Context**: Triggered by tapping an entry card from the timeline.
   - **Components**:
     - Navigation anchor: `← Timeline` back trigger, `"Saved"` status, search and settings icons, user avatar.
     - Entry Metadata Row: Relative date (`"YESTERDAY"`), status badge (`🔒 Private vault`), and formatted date (`"Tuesday, September 3, 2024"`).
     - Summary Callout: AI 1-line gist in italic with spark glyph (*“Walked through the park after rain and outlined architecture decisions for the new project.”*).
     - Media Strip: Full playable voice memo (`▶ 1:18 • Spoken thought on trail`) and location tag (`📍 Golden Gate Park, SF`).
     - Image Attachment: Photo thumbnail with lightbox expansion capability.
     - Full Entry Body: Complete unabridged text with generous editorial line spacing.
     - Footer Metadata: Word count, read time (`"114 words • 1 min read"`), vault sync timestamp, `"Delete Entry"` (low-profile trash icon), and `"Export Markdown"` button.

4. **Screen 2.4: Transition to Full Entry View (Interactive State)**
   - **Context**: Captures the tactile animation state when expanding a search result or timeline card into the full entry.
   - **Visual Elements**:
     - Status Indicator: Breadcrumb trail (`🔍 Results → Sep 3, 2024`), pulsing badge (`● Opening`), and keyboard dismiss pill (`← Back ESC`).
     - Elevated expanded entry card layered above dimmed, ghosted secondary search result cards.

---

### Page 3: AI Companion (`/chat` or Modal/Drawer)

#### Purpose & Mental Model
A supportive conversational companion designed to talk, vent, and reflect. Creating journal entries is a **secondary, strictly consent-based** outcome. Supports both typed text and real-time live voice conversation via Google ADK.

#### Screens Under This Page:

1. **Screen 3.1: Conversational Chat Interface (Text Mode & Context Drafting)**
   - **Presentation**: Slide-up bottom sheet on mobile, slide-in drawer or centered modal on desktop.
   - **Header**:
     - Left: `"Reflect"` title with status dot.
     - Center: Dual Mode Switcher pill (`[= Text Chat] [🎙 Live Voice]`).
     - Right: Dismiss button (`×` or `Esc`).
   - **Chat Stream**:
     - Context-Aware Opening Question: Personalized prompt based on recent journal entries (e.g., *"Yesterday you mentioned preparing for the presentation. How did it feel?"*).
     - User Bubbles: Right-aligned, subtle neutral container.
     - Assistant Responses: Left-aligned, transparent container with subtle accent border.
   - **Drafted Journal Note Card (Context-Driven Journaling)**:
     - Triggered when AI detects a meaningful moment or user requests *"add this to my journal"*.
     - Header: `"Drafted Journal Note"` with `"Requires your confirmation"` badge.
     - Draft Text Box: Proposed entry text formulated from conversation context.
     - Action Controls:
       - Primary: `"Save to Today's Entry"`
       - Secondary: `"Save as New Separate Entry"`
       - Auxiliary: `"Edit Text"` (opens Screen 3.3) and `"Discard"`
     - **Negative Rule**: Never write to Firestore without explicit user tap.
   - **Input Bar**: Clean input field (*"Reflect with Journ..."*), hold-to-talk mic icon, and send button.

2. **Screen 3.2: AI Companion — Live Voice Interactive Mode**
   - **Context**: Activated via the "Live Voice" toggle in the header.
   - **Visual Centerpiece**:
     - Concentric animated audio pulse rings with microphone/waveform core icon.
     - Real-Time Status: `"Companion is listening..."` with subtext: *"Speak naturally • Journ transcribes reflections into journal notes in real-time"*.
   - **Live Dialogue Stream**:
     - AI spoken bubble (with voice glyph).
     - User spoken bubble: Transcribed live with user tag (e.g., `Alex (Spoken)`).
   - **Live Draft Card**: Real-time draft card updating as key thoughts emerge, complete with `"Syncing with Evening Reflections"`, `"Dismiss"`, and `"Keep Note"` actions.
   - **Bottom Control Dock**:
     - Left: `"Mute Mic"` button.
     - Center: Active voice indicator/pulse button (`Speaking`).
     - Right: Destructive red pill: `"End Voice"`.
     - Security Footnote: `"🔒 End-to-end encrypted voice session • Real-time ADK audio channel"`.

3. **Screen 3.3: Edit Drafted Note (Dedicated Full-Screen Mode)**
   - **Context**: Opened when the user taps "Edit Text" on any Draft Card.
   - **Header Bar**:
     - Left: `"Cancel"` (returns to chat without saving changes).
     - Center: `"Edit Drafted Note"`.
     - Right: `"Update Draft"` or `"Back to Chat"`.
   - **Synthesis Source Header**:
     - Chip: `"Journ Companion • Spoken reflection • Today at 10:45 AM"`.
     - Trigger prompt: *“Trigger prompt: 'Simplicity in layered architecture'”*.
     - Tag: `"Raw synthesis"`.
   - **Draft Title & Meta**: Headline (e.g., `"Wednesday, Sept 4 — Draft Reflection"`), word count (`47 words • ~1 min read`), status (`Unsaved to journal`).
   - **Editable Content Canvas**: Full-width, comfortable textarea allowing unrestricted edits before saving.
   - **Destination Selector**:
     - Radio Option A: `"Append to Today's Entry"` (*Merges as a new section under Sept 4*).
     - Radio Option B: `"Create as New Separate Entry"` (*Standalone entry in timeline archives*).
   - **Linked Attachments Strip**: Voice snippet pill (`▶ Voice snippet (0:24)`), `"Add photo"` trigger, and `"Add place"` trigger.
   - **Bottom Action Bar**:
     - Left: Destructive `"Discard Draft"` button.
     - Right: Dual save buttons: `"Save as New Entry"` and `"Save to Today's Entry"`.
     - Security Assurance: `"Autosaved as draft • Nothing commits to your permanent journal until confirmed."`

---

### Page 4: Search & Semantic Recall (`/search` or Overlay)

#### Purpose & Mental Model
Enables natural language semantic retrieval over the user's personal journal corpus via Vertex AI Vector Search (RAG). Users search by concepts, feelings, and questions rather than exact keywords.

#### Screens Under This Page:

1. **Screen 4.1: Natural Language Search Overlay & Suggestions**
   - **Presentation**: Full-screen modal overlay with auto-focused search bar.
   - **Header & Search Bar**:
     - Search Input: Pill-shaped input with magnifying glass glyph, clear button (`×`), and keyboard shortcut (`Esc to dismiss`).
     - Placeholder: *"Ask or search anything (e.g., 'when did I feel relieved or stressed about work')..."*
     - Subtitle: `"Search by concepts, feelings, or topics using plain language. Vertex AI Semantic Vector Recall"`.
   - **Suggested Reflections & Thematic Threads**:
     - Pre-computed prompt chips derived from user's habit memory:
       - *“When did I decide to simplify the architecture during a walk?”* (Matches 2 entries • September 2024)
       - *“Reflections about morning coffee and clarity in San Francisco”*
       - *“Moments of feeling overwhelmed by project scope in August”*
   - **Recent Searches**: List of historical queries with clear triggers.
   - **Semantic Result Feed**: Matching entry cards showing relevance percentage pills (e.g., `"94% relevance"`), snippet matches with highlighted semantic keywords (`weight lift`, `work deadline`, `relief`), and media tags.

2. **Screen 4.2: Natural Language Search Results / Highlight View**
   - **Context**: State after submitting a natural language query (e.g., *"when did I decide to simplify the architecture during a walk?"*).
   - **Active Result Card (Primary Match)**:
     - Header: Match badge (`98% Semantic Match • Primary Result`), timestamp, location (`Bernal Heights`).
     - Semantic Match Chips: Keywords extracted by vector model (`architecture decisions`, `strip away complex state machine`, `simplicity is a discipline`).
     - Verbatim excerpt with matched concepts subtly highlighted.
     - Attached audio memo player and photo thumbnail.
     - Action: `"Tap to read full entry →"`.
   - **Secondary Clustered Results**: Subsequent cards ranked by cosine proximity (e.g., `81% Semantic Match`, `74% Semantic Match`).
   - **Footer**: `"End of semantic vector matches · 3 entries surfaced"`.

3. **Screen 4.3: Reverse Transition to Search (ESC Interaction State)**
   - **Context**: Displayed when the user presses `Esc` or clicks "Back to Search" from an expanded entry.
   - **Visual Elements**:
     - Status Indicator: `"← Returning to Search • collapsing canvas"` paired with `"● ESC pressed 0.3s"`.
     - Active collapsing card contracting back into the semantic prompt results cluster.

---

### Page 5: Account & Settings (`/settings` or Modal)

#### Purpose & Mental Model
Manages user identity, theme preferences, and privacy controls. Google OAuth is the identity provider.

#### Screens Under This Page:

1. **Screen 5.1: Account & Settings Screen**
   - **Header**: Navigation return (`← Back to Journal`), title `"Account & Settings"`, and subtitle `"Manage your journal identity, preferences, and data privacy."`
   - **Profile Card (Google Identity)**:
     - User photo (rounded avatar), Full Name (`Alex Chen`), Email (`alex.chen@gmail.com`).
     - Badge: `"Signed in via Google OAuth"`.
     - Privacy Guarantee: *"Journ only accesses your basic profile (name, email, avatar). No Google Drive, Calendar, or contacts scopes are requested."*
   - **Canvas Theme Selector**:
     - Segmented toggle: `[Light (Warm Paper)]` `[Dark (Charcoal)]` `[System]`.
     - Description: *"Editorial reading contrast designed to soothe eye strain."*
   - **Habit Memory & Reflection Settings**:
     - Status Badge: `"Local Vector State"`.
     - Explanatory Note: *"Your AI companion maintains a lightweight habit memory (<2000 tokens) updated silently in the background after 2 AM while you sleep. It learns your tone and topics to offer timely prompts without reading your raw entries on every turn."*
     - Toggle Control: `"Include past entries in AI companion reflections"` (On/Off switch).
   - **Current Session Card**:
     - Instance info: *"Signed in on this browser instance. Entries are continuously autosaved to your encrypted remote vault."*
     - Action: `"Log Out"` button.
   - **Danger Zone — Permanent Account Deletion**:
     - Warning Callout: Red accent box labeled `"Delete Account & All Data"`.
     - Warning Text: *"Permanently deletes your account, all journal entries, audio attachments, chat transcripts, and habit memory from Firestore and Vertex AI vector indices. This action is irreversible."*
     - Strict High-Friction Safeguard: Required text input field (*"Type DELETE below to confirm permanent deletion"*). Red button (*"Permanently Wipe All Data"*) remains disabled until exact keyword matches.
   - **System Footer**: `"Journ Sanctuary Engine • Encrypted Personal Archive • Version 2.4.1"`.

---

## 3. Design System & Token Specifications

### 3.1 Color Tokens

| Token Name | Light Mode (`Quiet Paper Editorial`) | Dark Mode (`Quiet Paper Charcoal`) | Usage |
| :--- | :--- | :--- | :--- |
| `bg-canvas` | `#FAFAF9` (Warm stone/paper) | `#121214` / `#131315` (Charcoal) | Base page canvas background |
| `bg-surface` | `#FFFFFF` (Pure white) | `#18181B` (Elevated charcoal) | Entry cards, modals, dialogs |
| `bg-subtle` | `#F4F4F5` (Soft warm gray) | `#27272A` (Muted dark gray) | Chips, audio player, draft boxes |
| `border-default` | `#E4E4E7` (Subtle 1px border) | `#27272A` (Dark border) | Card dividers, input borders |
| `text-primary` | `#18181B` (Near black zinc) | `#F4F4F5` (Soft white) | Headlines, active text, entries |
| `text-secondary` | `#71717A` (Muted gray) | `#A1A1AA` (Medium zinc) | Subtitles, timestamps, metadata |
| `text-tertiary` | `#A1A1AA` (Low contrast) | `#71717A` (Subdued gray) | Subtle hints, inactive icons |
| `status-saved` | `#16A34A` (Muted forest green) | `#22C55E` (Emerald green) | Autosave indicator label & dot |
| `status-danger` | `#DC2626` (Muted red) | `#EF4444` (Coral red) | Account deletion warnings & buttons |

### 3.2 Typography Scale
- **Headline Font**: `Newsreader` (Editorial serif)
- **Body & Interface Font**: `Inter` (Humanist sans-serif)

| Token | Desktop Size | Mobile Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 32px (2rem) | 26px (1.625rem) | 600 | 1.25 | -0.02em |
| `headline-md`| 24px (1.5rem) | 20px (1.25rem) | 500 | 1.35 | -0.015em |
| `body-lg` | 18px (1.125rem) | 16px (1.0rem) | 400 | 1.65 | 0 |
| `body-md` | 15px (0.9375rem) | 14px (0.875rem) | 400 | 1.55 | 0 |
| `label-md` | 13px (0.8125rem) | 12px (0.75rem) | 500 | 1.4 | +0.01em |
| `caption-sm` | 12px (0.75rem) | 11px (0.6875rem) | 400 | 1.3 | +0.02em |

### 3.3 Layout, Canal & Viewport Constraints
- **Primary Canal Max-Width**: Exactly `680px` centered. No multi-column dashboard layouts.
- **Mobile Viewport**: Optimized for `390px` width with safe-area bottom insets (`pb-safe`).
- **Touch Targets**: Minimum `44px x 44px` on interactive triggers.
- **Border Radius**: Small chips: `8px` (`rounded-lg`); Cards/Containers: `12px` (`rounded-xl`); Floating buttons: `9999px` (`rounded-full`).

---

## 4. Strict Negative Constraints ("What Developers Must NOT Build")

To protect the core philosophy of Journ, implementations must strictly follow these rules:

1. **NO Manual Save/Submit Buttons**: Writing is saved automatically via debounced background writes. Never render a "Save Entry" or "Publish" button on the main editor.
2. **NO Toast/Alert Popups on Autosave**: Autosave feedback is silent and discreet in the top navigation bar.
3. **NO Onboarding Wizards or Feature Carousels**: Logging in lands the user straight into today's editor.
4. **NO Social Media Features**: No share links, likes, comments, public profiles, or follower counts.
5. **NO Gamification or Streaks**: No fire icons, streak counters, badges, or missed-day notifications.
6. **NO Mood Pickers or Emotional Scores**: No daily 1–5 emoji ratings, mood graphs, or sentiment diagnostics.
7. **NO Raw Voice Transcripts in Entry Body**: Spoken audio is an attached playable clip. Its transcript is strictly internal for AI search and summaries.
8. **NO Silent AI Rewrites**: The AI companion must never overwrite user text without explicit user confirmation via the Draft Card.
9. **NO Heavy Interactive Maps**: Location attachments are simple text pills, never embedded satellite or street map tiles.
10. **NO Hexagonal / Over-Engineered Architecture**: Business logic rests in clean services; database operations reside in repositories.
