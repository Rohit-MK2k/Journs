# Backend Infrastructure & Presentation — Task 2

**Date:** 2026-09-03
**Scope:** Implement an Exception Filter to map Domain Errors to HTTP Status Codes

## Context
During an audit of the Business Logic layer, we confirmed that no presentation-layer code (such as NestJS `@Injectable` or `HttpException`) leaks into the pure Domain or Service layers.

However, the Domain services now throw specific semantic error classes (e.g., `ValidationError`, `NotFoundError`, `ConflictError`) located in `src/common/errors/`.

Currently, because the presentation layer has no global exception filter mapping these custom domain errors, NestJS will capture them as standard unhandled exceptions and return `500 Internal Server Error` to the client, even for simple 400 Bad Requests or 404 Not Found errors.

## Required Tasks

1. **Create a Global Exception Filter**
   Create a NestJS Exception Filter (e.g., `DomainExceptionFilter`) in the presentation or infrastructure layer.
   
2. **Map Domain Errors to HTTP Exceptions**
   The filter should catch `DomainError` (from `src/common/errors`) and map its subclasses to appropriate HTTP status codes:
   - `ValidationError` -> `400 Bad Request`
   - `NotFoundError` -> `404 Not Found`
   - `ConflictError` -> `409 Conflict`
   - Any other unmapped `DomainError` or generic `Error` can remain a `500 Internal Server Error`.

3. **Register the Filter**
   Register the exception filter globally in `main.ts` or as a global provider in `AppModule`.

4. **Add/Update Unit Tests**
   Write or update tests for the exception filter to verify that the domain errors are mapped to the correct HTTP status codes.

This will complete the decoupling of the presentation layer from the business logic layer, allowing the API to return proper REST semantics without forcing the domain layer to know about HTTP.
