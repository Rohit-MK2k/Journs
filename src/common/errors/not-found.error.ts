import { DomainError } from './domain.error';

/** Thrown when an entity cannot be found. */
export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
