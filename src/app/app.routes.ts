import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { adminGuard } from './core/auth/admin-guard';
import { firstAccessGuard } from './core/auth/first-access-guard';

import { Login } from './features/auth/login/login';
import { PrimerAcceso } from './features/auth/primer-acceso/primer-acceso';
import { RestablecerPassword } from './features/auth/restablecer-password/restablecer-password';
import { RecuperarPassword } from './features/auth/recuperar-password/recuperar-password';
import { Inicio } from './features/inicio/inicio';

import { ListadoEmpresas } from './features/empresa/listado-empresas/listado-empresas';
import { FormularioEmpresa } from './features/empresa/formulario-empresa/formulario-empresa';
import { ListadoMetodosFichaje } from './features/metodo-fichaje/listado-metodos-fichaje/listado-metodos-fichaje';

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
    path: 'empresas',
    component: ListadoEmpresas,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'empresas/nueva',
    component: FormularioEmpresa,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'empresas/:id/editar',
    component: FormularioEmpresa,
    canActivate: [authGuard, adminGuard],
  },

  {
    path: 'metodos-fichaje',
    component: ListadoMetodosFichaje,
    canActivate: [authGuard, adminGuard],
  },

  {
    path: 'restablecer-password',
    component: RestablecerPassword,
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