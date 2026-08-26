import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (
  _route,
  state
) => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);

  const sesion =
    authService.getSesion();


  if (
    authService.estaAutenticado()
    && sesion?.tipoToken === 'ACCESS'
  ) {
    return true;
  }

  if (
    state.url === '/notificaciones'
  ) {

    return router.createUrlTree(
      ['/login'],
      {
        queryParams: {
          returnUrl: '/notificaciones',
        },
      }
    );
  }
  return router.createUrlTree([
    '/login',
  ]);
};