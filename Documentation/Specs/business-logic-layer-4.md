# Business Logic Layer Task 4: Integration Data Processing & Cascading Deletion

## Overview
To support the frontend integration, specific backend business logic domains must be established to handle the data parsing, searching, and the strict account deletion constraints required by the UI.

## Required Business Logic Implementations

### 1. Semantic Search Extractor Service
The frontend search UI expects not just matched documents, but specific "Semantic Chips" (keywords) and a "Match Score". 
- **Responsibility**: Upon querying the vector database (Vertex AI), this service must map the vector distance score into a human-readable percentage (`matchScore`, e.g., 98%).
- **Keyword Extraction**: It must utilize a lightweight prompt or NLP extraction to identify 2-3 key phrases (`semanticChips`) from the matched document that directly relate to the user's query, for frontend highlighting.

### 2. Cascading Account Deletion Service
The Settings UI allows the user to permanently wipe all data. This is a critical operation.
- **Responsibility**: A dedicated service method (`wipeUserData(uid: string)`) must execute a distributed transaction or batch operation.
- **Operations**:
  1. Delete the user document from the `users` collection.
  2. Recursively delete all documents in the `entries` subcollection.
  3. Dispatch a command to the Vector Database (Vertex AI) to purge all embeddings associated with this `uid` to prevent data leakage.
  4. Finally, call Firebase Admin Auth to revoke tokens and delete the actual Authentication record.

### 3. Autosave Concurrency Service
- **Responsibility**: The frontend will send debounced autosaves frequently. The business logic must implement an optimistic concurrency control or simple timestamp-based "last-write-wins" logic to ensure rapid successive `POST /autosave` requests don't cause race conditions in Firestore.
