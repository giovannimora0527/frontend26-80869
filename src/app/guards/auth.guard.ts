import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Solo deja entrar si hay sesión válida; si no, manda al login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return true;
  }
  auth.logout(false);
  return router.createUrlTree(['/login']);
};

/** Si ya hay sesión, no tiene sentido volver al login. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.createUrlTree(['/inicio']) : true;
};

/** Solo deja abrir las pantallas que están en la menuList del usuario. */
export const menuGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const url = state.url.split('?')[0].split('#')[0];
  if (url === '/inicio' || url === '/inicio/') {
    return true;
  }
  const permitido = auth.getMenus().some((m) => url === m.url || url.startsWith(m.url + '/'));
  return permitido ? true : router.createUrlTree(['/inicio']);
};
