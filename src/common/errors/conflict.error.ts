import { DomainError } from './domain.error';

/** Thrown when an operation conflicts with current domain state (e.g., duplicates). */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
