import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { CORRELATION_HEADER } from '../middleware/correlation-id.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    const correlationId = request.headers[CORRELATION_HEADER] as string;

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message: typeof message === 'object' && message !== null ? (message as any).message || (message as any) : message,
    };

    this.logger.error(
      `HTTP Exception occurred at ${request.url} [Status ${status}]`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
      { correlationId }
    );

    response.status(status).json(errorResponse);
  }
}
