# Business Logic Layer — Task 2

**Date:** 2026-09-03
**Scope:** Fix `EntryService` domain model usage in `createEntry` parameter
**Status:** Complete — Domain model aligned with infrastructure and presentation logic, all tests passing.

---

## What Was Fixed

1. **`CreateAttachmentInput` Type Added**
   Added a new `CreateAttachmentInput` type to `src/entries/domain/attachment.ts` which uses `Omit<Attachment, 'id' | 'entryId' | 'createdAt'>`. This allows attachment creation inputs from the user to omit internally-generated IDs and timestamps.

2. **`CreateEntryInput` Type Added**
   Added a new `CreateEntryInput` type to `src/entries/domain/entry.ts` which is `Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'attachments'> & { attachments: CreateAttachmentInput[] }`.

3. **`EntryService.createEntry` Updated**
   Updated the signature of `EntryService.createEntry` to accept `CreateAttachmentInput[]` instead of `Attachment[]`.

4. **`EntryRepository.save` Updated**
   Updated the `EntryRepository` interface to use `CreateEntryInput` instead of `Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>`.

5. **`FirestoreEntryRepository.save` Updated**
   Modified the concrete `FirestoreEntryRepository.save` implementation to properly generate IDs, `createdAt`, and `updatedAt` for the new entry, and correctly generate `id`, `entryId`, and `createdAt` for every attachment passed in.

6. **Controller Cleanup**
   Removed the temporary `as any` casting from `EntriesController.createEntry`, securely passing the DTO payload directly to the service.

7. **DTO Strictness**
   Made `url` explicitly required in `AttachmentDto` to match the stricter domain shape requirements.

All 75 tests are currently passing across the codebase, ensuring full domain compliance and correct integration across the Controller, Service, and Repository layers.
