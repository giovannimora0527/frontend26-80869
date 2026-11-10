import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getJwtRol, isJwtVigente } from '../utils/jwt.util';

/**
 * Guard de autorizacion por rol.
 *
 * Se utiliza en las rutas que deben restringirse a determinados perfiles.
 * Los roles permitidos se declaran en la propiedad `data.roles` de la ruta.
 *
 * Ejemplo de uso en la definicion de rutas:
 *   {
 *     path: 'despacho',
 *     component: DespachoComponent,
 *     canActivate: [roleGuard],
 *     data: { roles: ['DESPACHO_MEDICO'] }
 *   }
 *
 * Este guard complementa el control de acceso del backend; la seguridad
 * efectiva se valida siempre en el servidor.
 */
export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  if (!isJwtVigente()) {
    return router.createUrlTree(['/login']);
  }

  const rolesPermitidos = (route.data?.['roles'] as string[] | undefined) ?? [];
  if (rolesPermitidos.length === 0) {
    return true;
  }

  const rol = getJwtRol();
  if (rol !== null && rolesPermitidos.includes(rol)) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};
