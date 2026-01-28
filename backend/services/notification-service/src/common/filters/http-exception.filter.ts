import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Filtro global de excepciones HTTP.
 * Formatea errores de forma consistente y oculta stack traces en producción.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException ? exception.getResponse() : null;

        let message: string | string[] = 'Internal server error';
        let error = 'Internal Server Error';

        if (exceptionResponse) {
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || message;
                error = (exceptionResponse as any).error || error;
            }
        }

        // Log completo para debugging interno
        if (status >= 500) {
            this.logger.error(
                `${request.method} ${request.url} - ${status}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        }

        response.status(status).json({
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
