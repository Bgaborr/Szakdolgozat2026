// src/app/core/interceptors/silent-error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, of } from 'rxjs';

export const silentErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) return of(err);
      throw err;
    }),
  );
};
