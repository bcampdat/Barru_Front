import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { firstAccessGuard } from './core/auth/first-access-guard';

import { Login } from './features/auth/login/login';
import { PrimerAcceso } from './features/auth/primer-acceso/primer-acceso';
import { RestablecerPassword } from './features/auth/restablecer-password/restablecer-password';
import { RecuperarPassword } from './features/auth/recuperar-password/recuperar-password';
import { Inicio } from './features/inicio/inicio';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'primer-acceso',
    component: PrimerAcceso,
    canActivate: [firstAccessGuard],
  },
  {
    path: 'inicio',
    component: Inicio,
    canActivate: [authGuard],
  },
  {
    path: 'restablecer-password',
    component: RestablecerPassword
  },  
  {
  path: 'recuperar-password',
  component: RecuperarPassword,
  },  
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];