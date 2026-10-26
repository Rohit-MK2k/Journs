import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainError, ValidationError, NotFoundError, ConflictError } from '../../errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (exception instanceof NotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else if (exception instanceof ConflictError) {
      status = HttpStatus.CONFLICT;
      message = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
