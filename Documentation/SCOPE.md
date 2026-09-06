# Journaling App — Scope Document

## Purpose

A journaling app is a private, digital notebook. It exists so a person can turn
thought into written word, for themselves, with no audience. Core value: lower
the friction of writing (versus a physical notebook) while adding just enough
structure to build a consistent habit.

Journaling itself means the habit of regularly (usually daily) recording
thought, event, or feeling — personal, reflective, recurring, and free of
fixed format. It differs from a diary in that it's not just "what happened"
but often "what it meant."

---

## The Cake (Core — without this, it's not a journaling app)

The absolute minimum that makes the app a journal at all:

1. **Write** — create an entry (text)
2. **Save** — persist the entry, automatically
3. **Read** — view past entries later

Strip anything else (mood, tags, prompts, reminders, streaks) — still a
journaling app. Strip write/save/read — no longer one.

### Cake-level UX refinements (not new features, just removing friction)

- **Write**
  - App opens straight into today's entry — no menu detour
  - Cursor auto-focused, keyboard opens automatically
  - Distraction-free editor — minimal chrome
  - Soft placeholder text on empty state, not a blank void
- **Save**
  - Explicit manual **Save** button commits the entry to the server and clears the editor for the next entry
  - Automatic debounced save stores an active draft locally in browser `localStorage` to prevent accidental loss
  - Local draft automatically expires and discards when the current calendar day ends (midnight, not a rolling 24-hour window)
  - Committed entries are stored server-side, tied to the user's account — see Account & Login section
- **Read**
  - Main dashboard displays "Today's Entries" featuring all entries recorded for the current day, sorted newest-first with creation timestamps (e.g., 10:45 AM)
  - If no entries exist for the day, displays an empty state ("No entries for today")
  - A tab switcher on the dashboard allows viewing "Past Entries" (chronological timeline of previous days)
  - Tap entry → straight into view/edit, no extra button hunt
  - Fast, natural scroll
- **Cross-cutting**
  - Speed — any lag between thought and page breaks the whole point
  - Readable typography — comfortable font size and line height for reread

### Cake-level decisions (shape the whole feel)

- **Primary entry mode is text.** Voice, photo, and location are optional
  attachments layered onto a text entry — not separate/alternate entry types.
- Multiple entries are allowed per calendar day.

---

## On Top of the Cake (Enhancements)

### 1. Optional entry attachments

All optional, per-entry, never forced or default-prompted:

- **Voice** — saved as an actual **audio clip**, attached to the entry
  alongside text (not transcribed-and-discarded, not a replacement for
  typing). A transcript is generated **silently in the background** for AI
  summary/search purposes only — never shown to the user as "the entry."
- **Photo** — from gallery or camera, attached to the entry. Multiple photos
  allowed.
- **Location** — current GPS or manually picked place, shown as a simple text
  label on the entry (no heavy map UI needed).

An entry can combine any mix: text + voice clip + photo + location, all under
one date.

- **Attachment Lifecycle & Orphan Cleanup:**
  - When uploading attachments to an unsaved entry, metadata is staged locally in the draft (both in memory and debounced in browser `localStorage`), preventing premature entity creation or 404 errors.
  - Clicking **Save Entry** commits text and all staged attachments atomically to the server.
  - If a user uploads files but abandons their draft without saving, the unconfirmed storage uploads are tracked via a `pending_attachments` collection.
  - A scheduled background cron job runs daily at **2:00 AM**, purging all unconfirmed orphan files in cloud storage that were uploaded prior to the current day (`00:00:00`), keeping cloud storage costs minimal while protecting active late-night drafts.

### 2. AI on Write

- **Idle prompt** — if user pauses on a blank page, a **static, generic,
  non-AI** text prompt appears (rotating pool, e.g. "What's on your mind
  today?"). Text-only, not voice. Cheap, fast, no AI call needed.
- Purpose is to make the app feel like *someone is gently listening* —
  supportive, never pushy or interrupting.

### 3. AI on Read

- **Auto-summary** — AI generates a short 1-line gist of each entry (especially
  useful for voice entries, where the underlying transcript may be long or
  rambly) shown in the timeline list for fast scanning. The original saved
  entry is never altered — summary is a display helper only.
- **Natural language search** — user can search using plain questions (e.g.
  "when did I feel anxious about work") instead of exact keywords. On-demand
  only — AI cost/processing triggered by user action, not running passively.
- Reading stays otherwise lightweight — not everything needs AI involvement.

### 4. AI Chatbot

**Primary purpose: conversation.** The chatbot is first and foremost a place
to talk — vent, reflect, think out loud, like an empathetic listener. Creating
journal entries from chat is a **secondary**, occasional outcome, not the main
point of opening the chatbot.

**Two conversation modes:**

- **Text chat** — standard back-and-forth typed conversation.
- **Real-time voice conversation** — user talks to the AI live, spoken
  back-and-forth (not just narrating into a transcript, an actual live voice
  conversation). Same underlying purpose and behaviors as text chat below —
  voice is a different input/output mode for the same companion, not a
  separate feature set.

**Journal context:** the chatbot (in either mode) has access to the user's
past journal entries as context, which is what enables journal-aware answers
and personalized opening questions.

Behaviors:

- **Reflective companion** — conversational back-and-forth, gentle follow-up
  questions, helps user think out loud.
- **Journal-aware answers** — with access to past entries, chatbot can answer
  questions like "what was I stressed about last month?" — a conversational
  form of natural language search.
- **Context-aware opening question** — unlike the static blank-page prompt,
  the chatbot can open with a dynamic, personalized question based on recent
  entries (e.g. "yesterday you mentioned a presentation — how did it go?").
- **Context-driven journaling (consent-based, never silent/automatic):**
  - **AI-detected:** AI notices a meaningful moment in the conversation,
    extracts the relevant context (not the whole conversation), drafts it as
    journal-entry text, and asks the user if they'd like to save it.
  - **User-initiated:** user can say "add this to my journal" at any point,
    even if the AI didn't ask.
  - In both cases, the AI **shows the drafted entry text to the user first**.
    User can approve as-is, or edit the draft, before it's saved. Nothing is
    ever saved without explicit confirmation.
  - When saving, the AI always **asks the user** whether to create a new entry
    or add to today's existing entry — no silent default.

**Guardrails across all AI features:**

- AI never silently rewrites or alters a user's actual saved entry text.
- AI never scores, judges, or diagnoses mood/emotion.
- AI never sends guilt-trip or manipulative notifications.
- AI acts as a **passive, supportive presence** — surfaces patterns or asks
  questions only when invited or clearly appropriate, never lectures or
  pushes unsolicited advice.

### 5. Habit memory

An underlying system where the AI maintains a memory of the user's journaling
habits and patterns, built **from the user's own journal context** (entries,
topics, tone, frequency). This memory is what lets the chatbot calibrate
things like how eagerly to offer saving context into the journal, and could
later inform other areas (e.g. idle-prompt timing).

- **Update timing:** habit memory is not updated live/instantly on every
  entry. It refreshes on a **scheduled background job, after 2am** (when the
  user is asleep) — processing the day's (and recent) journal activity to
  update the memory silently.
- **Background, invisible:** this process is never user-facing — no loading
  state, no notification, nothing for the user to configure or watch happen.
  User simply finds the AI slightly more attuned the next day.
- **Rationale:** keeps AI behavior stable and consistent *within* a day (no
  memory shifting mid-conversation), and avoids doing this heavier processing
  while the user is actively using the app — pure background maintenance
  during an off-peak/inactive window.

---

## Account & Login

The app is a **web browser app**. Google login is the **only** account
option — no email/password.

- **Login flow** — single "Continue with Google" button, OAuth. No separate
  signup step: first-time Google login automatically creates the account.
- **What's used from Google** — email (as account identity), name, and
  profile picture (shown only in a small account/settings corner — the
  journal itself has no social surface). No additional Google scopes
  (Drive, Calendar, etc.) requested.
- **Session** — persistent login across visits (browser session/token), so a
  daily-habit app doesn't force re-login friction. Logout is an explicit
  user action.
- **Data storage** — since login ties the account to entries, data is stored
  **server-side**, not device/browser-local. This supersedes the earlier
  "local storage only" cake note — logging in with the same Google account
  from a different browser/device shows the same journal.
- **First-time experience** — no separate onboarding/welcome screen. Right
  after first Google login, user lands straight on today's blank entry page,
  matching the cake principle of zero friction between opening the app and
  writing.
- **Account deletion** — user can delete their account, which deletes all
  their data (entries, attachments, chat history, habit memory) entirely.
  Given the sensitivity of journal data, this action requires an explicit
  confirmation prompt before proceeding — not a single-tap irreversible
  action.

