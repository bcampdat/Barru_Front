import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.getSesion()?.rol !== 'ADMIN_SISTEMA') {
    return router.createUrlTree(['/inicio']);
  }

  return true;
};