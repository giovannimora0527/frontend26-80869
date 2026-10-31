import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Si el backend responde 401 (token vencido o inválido), se cierra la sesión
 * y se vuelve al login. AuthService se pide "tarde" con el Injector para evitar
 * una dependencia circular con HttpClient.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        injector.get(AuthService).logout();
      }
      return throwError(() => error);
    })
  );
};
