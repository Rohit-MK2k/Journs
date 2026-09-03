# Business Logic Layer — Task 3

**Date:** 2026-09-03
**Scope:** Architecture purity audit and domain error classes implementation
**Status:** Complete — No lower-level leaks found. Domain errors added for cleaner presentation mapping.

---

## What Was Checked

Conducted a full audit of the Business Logic layer (`src/entries/domain`, `services`, `interfaces`, `src/chat/...`, `src/habit-memory/...`, `src/common/...`) to verify the Dependency Inversion Principle (DIP) and ensure no lower-level logic (e.g., databases, frameworks, HTTP) is leaking into the highest level.

- **Findings:** The Business Logic layer remains pure. It contains zero `@Injectable()` decorators, zero `@nestjs/common` imports, zero `class-validator` references, and zero Firebase dependencies. Instantiation is correctly handled via `useFactory` in the outer infrastructure modules.

## What Was Enhanced

While the domain layer correctly threw standard JavaScript `Error` objects for business rule violations (e.g., validation failures, conflicts), this meant the presentation layer would blindly return `500 Internal Server Error` unless it resorted to string-matching error messages (which is fragile).

To allow the lower level (Presentation) to easily interact with the Business layer *without* leaking HTTP logic into the Domain, a suite of custom **Domain Errors** was introduced.

### 1. Domain Errors (`src/common/errors/`)
Created standard error classes that extend the native `Error`:
- `DomainError` (abstract base class)
- `ValidationError` (for bad inputs, e.g., missing uid)
- `NotFoundError` (for missing entities)
- `ConflictError` (for duplicate entries or state conflicts)

### 2. Service Refactoring
Refactored `EntryService`, `ChatService`, and `HabitMemoryService` to throw these specific domain errors instead of generic `Error`.
- Example: `throw new ValidationError('uid must not be empty');`
- Example: `throw new ConflictError('An entry for today already exists');`

### 3. Unit Tests
Upgraded the unit tests in `entry.service.spec.ts`, `chat.service.spec.ts`, and `habit-memory.service.spec.ts` to strictly assert the specific custom error classes (e.g., `expect(...).rejects.toThrow(ValidationError)`) rather than just matching string messages. All 75 unit tests across the backend continue to pass.

## Next Steps

Created `Documentation/Specs/backend-infrastructure-presentation-2.md` instructing the Presentation agent to implement a NestJS **Global Exception Filter**. This filter will catch `DomainError` and elegantly map `ValidationError` to 400, `NotFoundError` to 404, and `ConflictError` to 409, ensuring correct API semantics without compromising domain purity.
