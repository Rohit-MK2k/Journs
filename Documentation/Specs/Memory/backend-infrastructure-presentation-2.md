# Backend Infrastructure & Presentation — Task 2 (Part 2)

**Date:** 2026-09-03
**Scope:** Global Exception Filter for Domain Error mapping

## What Was Built

Following the business logic layer updates (Task 3), where semantic error classes (`ValidationError`, `NotFoundError`, `ConflictError`, `DomainError`) were introduced, the presentation layer required a mechanism to map these custom errors into appropriate RESTful HTTP Status Codes.

### 1. Global Exception Filter
Created a NestJS Exception Filter to capture pure domain errors and map them to standard HTTP exceptions:
- **Location:** `src/common/presentation/filters/domain-exception.filter.ts`
- **Mappings Implemented:**
  - `ValidationError` -> `400 Bad Request`
  - `NotFoundError` -> `404 Not Found`
  - `ConflictError` -> `409 Conflict`
  - Any generic `DomainError` -> `500 Internal Server Error`

### 2. AppModule Registration
Wired the filter into the application dependency graph globally in `AppModule` using NestJS's `APP_FILTER` provider token. This ensures all REST controllers automatically receive this translation without needing explicitly applied `@UseFilters()` decorators.

### 3. Testing
Created robust unit tests verifying the exact JSON responses and status codes returned by the filter:
- **Location:** `src/common/presentation/filters/__tests__/domain-exception.filter.spec.ts`
- Verified that all domain errors successfully produce the correct HTTP exception format.

The integration test (`src/__tests__/app.module.spec.ts`) was re-run and passed, confirming that the new filter resolves seamlessly within the DI container.

This completes the separation of concerns boundary: the Business layer remains completely isolated from HTTP semantics, while the Presentation layer appropriately transforms semantic exceptions for the client.
