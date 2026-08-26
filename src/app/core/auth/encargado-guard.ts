import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from './auth.service';


export const encargadoGuard: CanActivateFn = () => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);


  if (
    !authService
      .estaAutenticado()
  ) {

    return router.createUrlTree([
      '/login',
    ]);
  }


  if (
    authService
      .getSesion()
      ?.rol !== 'ENCARGADO'
  ) {

    return router.createUrlTree([
      '/inicio',
    ]);
  }


  return true;
};