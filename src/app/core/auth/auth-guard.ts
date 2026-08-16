import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const sesion = authService.getSesion();

  if (
    authService.estaAutenticado()
    && sesion?.tipoToken === 'ACCESS'
  ) {
    return true;
  }

  return router.createUrlTree(['/login']);
};