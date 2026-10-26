import { ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from '../../../src/presentation/filters/domain-exception.filter';
import { ValidationError, NotFoundError, ConflictError, DomainError } from '../../../src/errors';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    const mockResponse = {
      status: mockStatus,
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => ({ url: '/test' }),
      }),
    } as any;
  });

  /**
   * @testType Unit Test
   * @target DomainExceptionFilter
   * @description Verifies that DomainExceptionFilter instantiates properly.
   */
  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  /**
   * @testType Unit Test
   * @target DomainExceptionFilter.catch
   * @description Verifies that domain ValidationError maps to HTTP 400 Bad Request with formatted response body.
   */
  it('should map ValidationError to 400', () => {
    const error = new ValidationError('Invalid input');
    filter.catch(error, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid input',
      }),
    );
  });

  /**
   * @testType Unit Test
   * @target DomainExceptionFilter.catch
   * @description Verifies that domain NotFoundError maps to HTTP 404 Not Found with formatted response body.
   */
  it('should map NotFoundError to 404', () => {
    const error = new NotFoundError('Entry not found');
    filter.catch(error, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Entry not found',
      }),
    );
  });

  /**
   * @testType Unit Test
   * @target DomainExceptionFilter.catch
   * @description Verifies that domain ConflictError maps to HTTP 409 Conflict with formatted response body.
   */
  it('should map ConflictError to 409', () => {
    const error = new ConflictError('Entry already exists');
    filter.catch(error, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: 'Entry already exists',
      }),
    );
  });

  /**
   * @testType Unit Test
   * @target DomainExceptionFilter.catch
   * @description Verifies that unknown DomainError instances fall back to HTTP 500 Internal Server Error.
   */
  it('should map generic DomainError to 500', () => {
    class GenericDomainError extends DomainError {}
    const error = new GenericDomainError('Unknown domain error');
    filter.catch(error, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
  });
});
