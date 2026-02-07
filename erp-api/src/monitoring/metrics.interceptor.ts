import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { httpRequestDuration, httpRequestsTotal } from './metrics';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  /**
   * Intercepts HTTP requests and records metrics
   * - Request duration (latency)
   * - Request count by method, route, and status
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Skip metrics endpoint to avoid recursive tracking
    if (request.path === '/metrics' || request.path === '/metrics/health') {
      return next.handle();
    }

    const method = request.method;
    const path = request.route?.path || request.path;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const status = response.statusCode;
          const duration = (Date.now() - startTime) / 1000;

          // Record metrics
          httpRequestDuration.labels(method, path, status).observe(duration);
          httpRequestsTotal.labels(method, path, status).inc();
        },
        error: (error) => {
          const status = error?.status || 500;
          const duration = (Date.now() - startTime) / 1000;

          // Record error metrics
          httpRequestDuration.labels(method, path, status).observe(duration);
          httpRequestsTotal.labels(method, path, status).inc();
        },
      }),
      catchError((error) => {
        const status = error?.status || 500;
        const duration = (Date.now() - startTime) / 1000;

        // Record error metrics
        httpRequestDuration.labels(method, path, status).observe(duration);
        httpRequestsTotal.labels(method, path, status).inc();

        throw error;
      }),
    );
  }
}
