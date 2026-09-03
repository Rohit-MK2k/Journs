# Backend Infrastructure & Presentation — Task 3

**Date:** 2026-09-03
**Scope:** Decouple Presentation Layer from Infrastructure Logic (Remove Leaks)

## Context

A structural audit revealed that the Presentation Layer (specifically the REST controllers) had a hard dependency on the `FirebaseAuthGuard`. 

By explicitly declaring `@UseGuards(FirebaseAuthGuard)` inside `EntriesController` and `ChatController`, the Presentation layer became tightly coupled to the specific Firebase Admin SDK implementation in the Infrastructure layer. This violated the principle that higher-level layers should not know about lower-level implementation details. This leak was further proven by the fact that controller unit tests required a `jest.mock('firebase-admin/auth')` just to run.

## What Was Changed

1. **Removed Concrete Guard from Controllers:**
   - Removed the `@UseGuards(FirebaseAuthGuard)` decorator and corresponding imports from both `EntriesController` and `ChatController`.
   - The controllers are now completely agnostic to how authentication is performed.

2. **Registered Guard Globally:**
   - Moved the routing of the `FirebaseAuthGuard` into the DI bootstrapping layer (`AppModule`).
   - Registered it using the NestJS `APP_GUARD` provider. This ensures all routes remain protected by the infrastructure guard without polluting the controller files.

3. **Cleaned Up Unit Tests:**
   - Removed `firebase-admin/auth` mocks from `entries.controller.spec.ts` and `chat.controller.spec.ts`.
   - Proved that the presentation layer can now be tested in pure isolation without needing infrastructure SDK stubs.

*(Note: The `HabitMemoryCronService` also utilizes the `firebase-admin/auth` SDK. Since Cron services orchestrate background tasks and reside strictly within the `/infrastructure/jobs` boundary, this is a valid placement and not considered an upward leak into the presentation REST layer.)*
