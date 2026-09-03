# Business Logic Layer — Task 2

**Date:** 2026-09-03
**Scope:** Fix `EntryService` domain model usage in `createEntry` parameter

## Context

While implementing the Presentation Layer (Controllers and DTOs), it became evident that `EntryService.createEntry` requires an array of `Attachment` domain entities:

```ts
async createEntry(
  uid: string,
  text: string,
  attachments: Attachment[] = [],
): Promise<Entry>
```

However, `Attachment` demands fields such as `id`, `entryId`, and `createdAt`, which are not present in incoming client requests (e.g., `AttachmentDto`). The presentation layer cannot correctly construct these entities because `entryId` doesn't exist until the entry is saved.

## Required Fixes

1. Update `EntryService.createEntry` signature to accept a type that doesn't enforce generated identifiers (e.g., `Omit<Attachment, 'id' | 'entryId' | 'createdAt'>[]` or a dedicated `CreateAttachmentInput` interface).
2. Adjust the mapping inside `EntryService.createEntry` or `EntryRepository` so that `attachments` receive their identifiers properly.
3. Remove the temporary `as any` cast in `EntriesController` once the service signature is corrected.
4. Update `EntryService` unit tests to reflect the new input parameters.
