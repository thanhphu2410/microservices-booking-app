import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';

export interface IdempotencyResponse {
  idempotencyKey: string;
  cached: boolean;
  data: any;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly idempotencyStore = new Map<string, { response: any; timestamp: number }>();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Only apply to POST/PUT/PATCH methods
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return next.handle();
    }

    const idempotencyKey = request.headers['idempotency-key'] as string;

    // For critical operations, require idempotency key
    const criticalPaths = ['/seats/hold', '/seats/book', '/seats/release', '/payment/pay'];
    if (criticalPaths.includes(request.path) && !idempotencyKey) {
      this.logger.warn(`Missing Idempotency-Key for critical operation: ${request.method} ${request.path}`);
      throw new HttpException(
        'Idempotency-Key header is required for this operation',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!idempotencyKey) {
      return next.handle();
    }

    // Check if we have a cached response
    const cached = this.idempotencyStore.get(idempotencyKey);
    if (cached && (Date.now() - cached.timestamp) < this.TTL_MS) {
      this.logger.log(`Idempotency CACHE HIT: ${request.method} ${request.path} - Key: ${idempotencyKey}`);
      response.setHeader('X-Idempotency-Cached', 'true');
      return new Observable(subscriber => {
        subscriber.next(cached.response);
        subscriber.complete();
      });
    }

    // Execute the handler and cache the response
    this.logger.log(`Idempotency CACHE MISS: ${request.method} ${request.path} - Key: ${idempotencyKey}`);
    return new Observable(subscriber => {
      next.handle().subscribe({
        next: (data) => {
          this.idempotencyStore.set(idempotencyKey, {
            response: data,
            timestamp: Date.now()
          });

          // Clean up expired entries periodically
          this.cleanupExpiredEntries();

          response.setHeader('X-Idempotency-Cached', 'false');
          this.logger.log(`Idempotency CACHE STORE: ${request.method} ${request.path} - Key: ${idempotencyKey}`);
          subscriber.next(data);
          subscriber.complete();
        },
        error: (error) => {
          this.logger.error(`Idempotency ERROR: ${request.method} ${request.path} - Key: ${idempotencyKey}`, error);
          subscriber.error(error);
        }
      });
    });
  }

  private cleanupExpiredEntries() {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, value] of this.idempotencyStore.entries()) {
      if (now - value.timestamp > this.TTL_MS) {
        this.idempotencyStore.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      this.logger.log(`Idempotency CLEANUP: Removed ${cleanedCount} expired entries`);
    }
  }
}
