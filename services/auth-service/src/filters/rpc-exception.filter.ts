import { Catch, ArgumentsHost } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Observable, throwError } from 'rxjs';

interface RpcError {
  code: number;
  message: string;
  details: string | string[];
}

@Catch()
export class RpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const defaultError: RpcError = {
      code: status.INTERNAL,
      message: 'Internal server error',
      details: 'Something went wrong'
    };

    if (exception instanceof RpcException) {
      const rpcError = exception.getError();
      return throwError(() => ({
        code: status.INVALID_ARGUMENT,
        message: typeof rpcError === 'string' ? rpcError : (rpcError as any).message || defaultError.message,
        details: typeof rpcError === 'string' ? rpcError : (rpcError as any).details || defaultError.details
      }));
    }

    // Handle validation errors
    if (exception?.name === 'ValidationError' || exception?.name === 'BadRequestException') {
      return throwError(() => ({
        code: status.INVALID_ARGUMENT,
        message: 'Validation failed',
        details: exception.message || exception.response?.message || 'Invalid input'
      }));
    }

    // Handle any other error
    return throwError(() => ({
      code: status.INTERNAL,
      message: exception.message || defaultError.message,
      details: exception.stack || defaultError.details
    }));
  }
}