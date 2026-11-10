import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';

/**
 * Interceptor de autenticacion.
 *
 * Responsabilidades:
 *   1. Adjuntar el token JWT (si existe) en la cabecera Authorization de cada
 *      peticion saliente, de modo que el backend pueda validar la sesion.
 *   2. Manejar de forma centralizada las respuestas 401 (sesion invalida o
 *      expirada) y 403 (sin permisos), mostrando un mensaje claro al usuario.
 *      Ante un 401 se cierra la sesion local y se redirige al login.
 *
 * Las rutas de autenticacion (/auth/...) no requieren token; si no hay token
 * almacenado, la peticion se envia sin la cabecera Authorization.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const token = sessionStorage.getItem('token');

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        sessionStorage.removeItem('token');
        Swal.fire({
          icon: 'warning',
          title: 'Sesion finalizada',
          text: 'Su sesion no es valida o ha expirado. Por favor inicie sesion nuevamente.'
        });
        router.navigate(['/login']);
      } else if (error.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Acceso denegado',
          text: 'No tiene permisos para acceder a este recurso.'
        });
      }
      return throwError(() => error);
    })
  );
};
