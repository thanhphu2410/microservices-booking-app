import { Catch, RpcExceptionFilter as BaseRpcExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcExceptionFilter implements BaseRpcExceptionFilter<RpcException> {
  catch(exception: RpcException): Observable<any> {
    return throwError(() => ({
      code: 'INTERNAL',
      message: exception.message,
    }));
  }
}