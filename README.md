# Journ

Journ is a private, digital journaling web application designed to lower the friction of writing while providing intelligent, consent-driven AI assistance. The platform combines distraction-free daily journaling with semantic search, an empathetic AI companion, and background habit memory profiling.

---

## Table of Contents

- [Architecture & Design Principles](#architecture--design-principles)
  - [Layered Architecture](#layered-architecture)
  - [SOLID Principles](#solid-principles)
  - [DRY Principle & Single Source of Truth](#dry-principle--single-source-of-truth)
  - [Repository Pattern](#repository-pattern)
- [Core Features](#core-features)
  - [Journaling & Autosave](#journaling--autosave)
  - [Attachments & Storage Lifecycle](#attachments--storage-lifecycle)
  - [Semantic Vector Search](#semantic-vector-search)
  - [AI Companion Chat](#ai-companion-chat)
  - [Habit Memory & Writing Habits Profile](#habit-memory--writing-habits-profile)
  - [Account & Settings](#account--settings)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
  - [Backend Environment Variables](#backend-environment-variables)
  - [Frontend Environment Variables](#frontend-environment-variables)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running in Development](#running-in-development)
  - [Building and Running in Production](#building-and-running-in-production)
- [Administrative Scripts](#administrative-scripts)
- [Testing](#testing)

---

## Architecture & Design Principles

The application is structured around clean, decoupled domain-driven design principles. Business logic remains completely isolated from HTTP delivery mechanisms, database drivers, and external third-party SDKs.

### Layered Architecture

The backend follows a strict three-tier layered architecture:

1. **Controller Layer (NestJS):** Handles incoming HTTP requests, route definitions, parameter mapping, and DTO validation via `class-validator`. Contains zero business logic.
2. **Service Layer (Domain / Business Logic):** Houses domain rules, entry mutations, vector search orchestration, companion reflection flows, and habit memory scheduling. Depends exclusively on repository and provider abstractions.
3. **Repository & Provider Layer (Infrastructure):** Implements infrastructure contracts (`FirestoreEntryRepository`, `FirebaseStorageProvider`, `GeminiAIProvider`, `FirestoreCosineVectorSearchProvider`). Injected via the NestJS dependency injection container.

### SOLID Principles

- **Single Responsibility Principle (SRP):** Each class and service manages a single concern. For example, `EntryService` manages entry business rules, `FirestoreEntryRepository` manages Firestore persistence, and `GeminiAIProvider` manages LLM interactions.
- **Open/Closed Principle (OCP):** New storage providers, vector engines, or AI backends can be plugged in by implementing their respective interfaces without modifying domain services.
- **Liskov Substitution Principle (LSP):** Concrete repository implementations are fully interchangeable with fake or mock implementations during testing.
- **Interface Segregation Principle (ISP):** Abstractions are kept narrow and focused (`EntryRepository`, `StorageProvider`, `VectorSearchProvider`, `HabitMemoryStore`, `AIProvider`).
- **Dependency Inversion Principle (DIP):** High-level domain services depend upon abstract interfaces rather than concrete infrastructure classes.

### DRY Principle & Single Source of Truth

- Business rules, validation constraints, and data definitions are maintained in single authoritative locations.
- Data structures are normalized across Firestore collections and subcollections (`users/{uid}/entries/{id}`, `users/{uid}/habitMemory`) rather than duplicated inline.

### Repository Pattern

The repository pattern is enforced across all data access operations:
- **Domain Model / Entity:** Data blueprints (`Entry`, `HabitMemory`, `PendingAttachment`, `AccountSettings`).
- **Repository Interface:** Contracts defining storage operations (`EntryRepository`, `HabitMemoryStore`, `PendingAttachmentRepository`).
- **Concrete Repository:** Firestore-backed persistence layer implementing query execution, undefined value sanitization, and data mapping.
- **Service Layer:** Consumes data solely via repository interfaces, enabling isolated unit testing with mocks.

---

## Core Features

### Journaling & Autosave
- **Zero-Friction Writing:** The editor opens directly to today's entry with auto-focus and minimal chrome.
- **Dual-Layer Autosave:**
  - Local debounced caching in browser `localStorage` prevents accidental data loss during active authoring.
  - Drafts naturally expire at calendar midnight.
  - Explicit commit actions persist entries to the backend API and clear local staging.
- **Intelligent Summarization:**
  - AI generates a concise, first-person 20-30 word gist for each entry.
  - Entries containing 20 words or fewer, or composed primarily of code blocks, skip summarization to preserve formatting and reduce unnecessary API calls.
- **Timeline Organization:** Entries are grouped by calendar day, supporting multiple entries per day sorted newest-first.

### Attachments & Storage Lifecycle
- **Polymorphic Media:** Entries support photo attachments, voice recordings, and geographic location stamps.
- **V4 Signed URLs:** Cloud Storage assets are delivered via expiring V4 read-signed URLs, preventing unauthorized access.
- **Interactive Lightbox & Audio Player:** Photos can be enlarged via a modal lightbox; voice notes can be played directly via an embedded audio player.
- **Orphan Cleanup Cron:** Uncommitted uploads are tracked in a `pending_attachments` collection. A daily cron job at 02:00 AM purges abandoned uploads from Cloud Storage, protecting active late-night drafts while eliminating storage waste.

### Semantic Vector Search
- **Native Firestore Cosine Vector Search:** Entries are embedded via Google's `gemini-embedding-2` (768 dimensions) and indexed directly in Firestore using `FieldValue.vector` and `findNearest` queries with cosine distance.
- **Natural Language Retrieval:** Users can query by subjective meaning (e.g., "when did I feel overwhelmed at work?").
- **Deep-Linking:** Clicking any search result card navigates directly to the dashboard with the target entry highlighted and loaded (`/?entry=<id>`).

### AI Companion Chat
- **Reflective Companion:** An interactive conversational listener powered by Gemini that provides supportive reflection based on journal context.
- **Server-Sent Events (SSE):** Real-time token streaming for low-latency chat replies.
- **Consent-Driven Journal Drafting:**
  - When meaningful insights emerge during chat, the assistant drafts entry text and prompts the user for confirmation.
  - The user chooses whether to append to today's entry or create a new entry.
  - No text is ever committed without explicit user approval.
- **Session Auto-Recovery:** Detects and resolves session state conflicts automatically to maintain continuous chat availability.
- **Focused Text Experience:** Voice conversation mode is completely removed from the UI to maintain a calm, text-focused writing environment.

### Habit Memory & Writing Habits Profile
- **Ambient Calibration:** Analyzes recent entries to derive user habits:
  - High-frequency topics and themes
  - Emotional tone and sentiment patterns
  - Journaling frequency and consistency
  - Writing habits: formatting structure, depth and length, routine timing, and vocabulary
- **Adaptive Mirroring:** The AI companion dynamically mirrors the user's preferred brevity, vocabulary, and formatting during chat.
- **Background Computation:** Habit memory derivation runs silently after 02:00 AM to keep daytime AI behavior stable and prevent user latency.
- **Settings Inspection Grid:** Users can inspect their derived writing habits profile via a 2x2 read-only grid on the settings page, with support for manual refreshing.

### Account & Settings
- **Google OAuth Authentication:** Streamlined sign-in via Firebase Authentication with zero manual password management.
- **Theme Persistence:** Theme toggle (light, dark, system) with zero-flash execution via a pre-paint bootstrap script in the document head.
- **Danger Zone Wipe:** Complete, irreversible deletion of all user records, entries, attachments, chat history, and habit memories.

---

## Tech Stack

### Backend
- **Framework:** NestJS 10 (Express platform)
- **Language:** TypeScript 5.4
- **Authentication:** Firebase Admin SDK (ID token verification)
- **Database & Storage:** Google Cloud Firestore, Google Cloud Storage
- **AI & Embeddings:** `@google/genai` (Gemini 3.6 Flash, Gemini Embedding-2)
- **Scheduling:** `@nestjs/schedule` (daily cron jobs)
- **Validation:** `class-validator`, `class-transformer`

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **State & Data Fetching:** SWR, React hooks
- **Authentication:** Firebase Web Client SDK 12

---

## Project Structure

```
.
├── .env.example               # Backend environment variables template
├── Documentation/             # Scope, architecture, and memory change logs
│   ├── ARCHITECTURE.md
│   ├── SCOPE.md
│   └── Specs/Memory/
│       ├── change-log-1.md
│       ├── change-log-2.md
│       └── change-log-3.md
├── frontend/                  # Next.js 16 App Router frontend
│   ├── .env.local.example     # Frontend environment variables template
│   ├── next.config.ts         # Rewrites /api/* to http://localhost:8000
│   ├── package.json
│   ├── src/
│   │   ├── app/               # Routes: /, /chat, /search, /settings, /login
│   │   ├── components/        # AuthGuard, Navigation, Lightbox, etc.
│   │   └── lib/               # API client and Firebase web client initialization
│   └── tsconfig.json
├── package.json               # Root monorepo scripts & backend dependencies
├── scripts/                   # Administrative and maintenance CLI utilities
│   ├── force-habit-generation.ts
│   └── reindex-entries.ts
├── src/                       # NestJS API backend
│   ├── account/               # Account settings and data wipe module
│   ├── app.module.ts          # Root NestJS application module
│   ├── chat/                  # AI companion chat & draft generation module
│   ├── common/                # Shared errors, guards, filters, and providers
│   ├── entries/               # Journal entries, attachments, and search module
│   ├── habit-memory/          # Habit derivation and cron scheduling module
│   └── main.ts                # Application bootstrap entry point
└── tsconfig.json              # Backend TypeScript configuration
```

---

## Environment Configuration

### Backend Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Frontend application port (default: `3000`) |
| `BACKEND_PORT` | NestJS API port (default: `8000`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Google Service Account JSON file |
| `GCP_PROJECT_ID` | Google Cloud project identifier |
| `GCP_REGION` | Cloud region (e.g., `us-central1`) |
| `GENAI_LOCATION` | GenAI location identifier (e.g., `global`) |
| `VERTEX_INDEX_ID` | Optional Vertex AI index identifier |
| `VERTEX_INDEX_ENDPOINT_ID` | Optional Vertex AI index endpoint |
| `VERTEX_DEPLOYED_INDEX_ID` | Optional Vertex AI deployed index identifier |
| `VERTEX_PUBLIC_DOMAIN` | Optional Vertex AI public domain |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FIREBASE_STORAGE_BUCKET` | Google Cloud Storage / Firebase Storage bucket name |

### Frontend Environment Variables

Copy `frontend/.env.local.example` to `frontend/.env.local`:

```bash
cp frontend/.env.local.example frontend/.env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain (`<project-id>.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket domain |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web Application ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics Measurement ID (optional) |

---

## Getting Started

### Prerequisites

- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **Google Cloud Platform Project:**
  - Cloud Firestore enabled
  - Firebase Authentication configured with Google Sign-In provider
  - Cloud Storage bucket created
  - Service account credentials JSON with Firestore and Storage Admin permissions
  - Gemini API key

### Installation

Install root and backend dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
npm install --prefix frontend
```

### Running in Development

Start both backend (port 8000) and frontend (port 3000) concurrently:
```bash
npm run dev
```

Alternatively, start services independently:
```bash
# Backend API
npm run dev:backend

# Frontend Web Application
npm run dev:frontend
```

Once running:
- Web Application: `http://localhost:3000`
- API Endpoints: `http://localhost:8000/api`

### Building and Running in Production

Compile TypeScript backend and Next.js frontend:
```bash
npm run build:all
```

Start both compiled services:
```bash
npm run start:all
```

---

## Administrative Scripts

The repository includes CLI utilities for operational maintenance:

### 1. Reindex Entries for Vector Search
Generates missing Gemini 768-dimensional embeddings and backfills summary metadata for existing Firestore entries:
```bash
npm run reindex
```

### 2. Force Habit Generation
Prompts for user selection and immediately derives topic, frequency, tone, and writing habits for the selected user, bypassing the 02:00 AM cron:
```bash
npm run habit:generate
```

---

## Testing

The project maintains comprehensive unit and integration test coverage across both backend and frontend layers.

### Backend Tests (Jest)
Runs all 30 test suites (165 tests) across domain entities, controllers, services, repositories, and utilities:
```bash
npm run test
```

Generate coverage report:
```bash
npm run test:coverage
```

### Frontend Tests (Jest / React Testing Library)
Runs all 7 test suites (38 tests) verifying page components, auth readiness, theme toggles, and habit profiles:
```bash
npm run test:frontend
```
