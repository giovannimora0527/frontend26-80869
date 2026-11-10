import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../demo/pages/login/service/auth.service';
import { isJwtVigente } from '../utils/jwt.util';

/**
 * Guard de autenticacion.
 *
 * Permite el acceso solo si existe un token y este se encuentra vigente
 * (no expirado). Si el token falta o esta expirado, se limpia la sesion
 * local y se redirige al login.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && isJwtVigente()) {
    return true;
  }

  authService.logout();
  return router.createUrlTree(['/login']);
};
