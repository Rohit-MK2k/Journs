import { DomainError } from './domain.error';

/** Thrown when input data does not satisfy business rules or formatting constraints. */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
