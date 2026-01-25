import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

// Global exception filter kept as a utility; register in main.ts if desired.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    response.status(status).json({
      statusCode: status,
      message: (exception as any).message || 'Internal server error',
    });
  }
}
