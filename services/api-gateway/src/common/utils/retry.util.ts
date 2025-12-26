import { Logger } from '@nestjs/common';
import { firstValueFrom, Observable } from 'rxjs';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export class RetryUtil {
  private static readonly logger = new Logger(RetryUtil.name);

  /**
   * Retry a function with exponential backoff
   * Supports both Promises and Observables (for gRPC calls)
   * @param fn - Function to retry (can return Promise or Observable)
   * @param options - Retry configuration options
   * @returns Promise with the result of the function
   */
  static async retryWithBackoff<T>(
    fn: () => Promise<T> | Observable<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelayMs = 1000,
      maxDelayMs = 10000,
      backoffMultiplier = 2,
      retryableErrors = [
        'UNAVAILABLE',
        'DEADLINE_EXCEEDED',
        'RESOURCE_EXHAUSTED',
        'INTERNAL',
        'UNKNOWN',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EHOSTUNREACH',
        'NO CONNECTION ESTABLISHED',
        'CONNECT',
        'NAME RESOLUTION FAILED',
        'DNS',
      ],
    } = options;

    let lastError: any;
    let delay = initialDelayMs;

    this.logger.log(`[Retry] Starting retry mechanism - maxAttempts: ${maxAttempts}`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.log(`[Retry] Attempt ${attempt}/${maxAttempts} - executing function...`);
        const result = fn();

        // Handle both Promises and Observables
        if (result instanceof Observable) {
          this.logger.log(`[Retry] Attempt ${attempt}/${maxAttempts} - converting Observable to Promise...`);
          return await firstValueFrom(result);
        }
        this.logger.log(`[Retry] Attempt ${attempt}/${maxAttempts} - awaiting Promise...`);
        return await result;
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        // gRPC errors can have code in different places:
        // - error.code (gRPC status code like 14 for UNAVAILABLE)
        // - error.details (error message)
        // - error.message (error message)
        // - error.toString() (full error string)
        const errorCode = error?.code?.toString() || error?.status?.toString() || '';
        const errorMessage = error?.message || error?.details || error?.toString() || '';
        const errorString = `${errorCode} ${errorMessage}`.toUpperCase();

        // Log error details for debugging (only on first attempt)
        if (attempt === 1) {
          this.logger.warn(
            `[Retry] Error caught - code: ${errorCode}, message: ${errorMessage?.substring(0, 100)}`,
          );
        }

        const isRetryable = retryableErrors.some((retryableError) =>
          errorString.includes(retryableError.toUpperCase()),
        );

        // Also check for gRPC numeric codes (14 = UNAVAILABLE, 4 = DEADLINE_EXCEEDED, etc.)
        const grpcUnavailableCode = 14; // gRPC UNAVAILABLE
        const grpcDeadlineExceededCode = 4; // gRPC DEADLINE_EXCEEDED
        const grpcResourceExhaustedCode = 8; // gRPC RESOURCE_EXHAUSTED
        const grpcInternalCode = 13; // gRPC INTERNAL
        const grpcUnknownCode = 2; // gRPC UNKNOWN

        const isGrpcRetryable =
          error?.code === grpcUnavailableCode ||
          error?.code === grpcDeadlineExceededCode ||
          error?.code === grpcResourceExhaustedCode ||
          error?.code === grpcInternalCode ||
          error?.code === grpcUnknownCode;

        // Check for network errors in error message (EHOSTUNREACH, ECONNREFUSED, etc.)
        const hasNetworkError =
          errorString.includes('EHOSTUNREACH') ||
          errorString.includes('ECONNREFUSED') ||
          errorString.includes('ETIMEDOUT') ||
          errorString.includes('ENOTFOUND') ||
          errorString.includes('NO CONNECTION ESTABLISHED') ||
          errorString.includes('CONNECT') ||
          errorString.includes('NAME RESOLUTION FAILED') ||
          errorString.includes('DNS');

        const shouldRetry = isRetryable || isGrpcRetryable || hasNetworkError;

        // If not retryable or last attempt, throw immediately
        if (!shouldRetry || attempt === maxAttempts) {
          if (attempt === maxAttempts) {
            this.logger.error(
              `[Retry] Retry exhausted after ${maxAttempts} attempts. Last error: ${error?.message || error?.details || error?.toString() || 'Unknown error'}`,
            );
          } else {
            this.logger.warn(
              `[Retry] Non-retryable error encountered: ${error?.message || error?.details || error?.toString() || 'Unknown error'}. Not retrying.`,
            );
          }
          throw error;
        }

        // Calculate delay with exponential backoff
        const currentDelay = Math.min(delay, maxDelayMs);
        this.logger.warn(
          `[Retry] Attempt ${attempt}/${maxAttempts} failed: ${error?.message || error?.details || error?.toString() || 'Unknown error'}. Retrying in ${currentDelay}ms...`,
        );

        await this.sleep(currentDelay);
        delay *= backoffMultiplier;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable based on gRPC status codes
   */
  static isRetryableError(error: any): boolean {
    const retryableCodes = [
      'UNAVAILABLE', // Service unavailable
      'DEADLINE_EXCEEDED', // Timeout
      'RESOURCE_EXHAUSTED', // Rate limiting
      'INTERNAL', // Internal server error (might be transient)
      'UNKNOWN', // Unknown error (might be transient)
    ];

    const errorCode = error?.code || error?.status || '';
    return retryableCodes.includes(String(errorCode).toUpperCase());
  }
}

