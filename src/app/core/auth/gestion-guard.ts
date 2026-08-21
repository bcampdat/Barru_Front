import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const gestionGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  const rol = authService.getSesion()?.rol;

  if (
    rol !== 'ADMIN_SISTEMA' &&
    rol !== 'ENCARGADO'
  ) {
    return router.createUrlTree(['/inicio']);
  }

  return true;
};